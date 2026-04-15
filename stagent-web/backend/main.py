"""STAgent Web 后端主入口"""
import os
import sys
import json
import uuid
import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List, Callable
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# 添加 STAgent 核心路径
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from stagent.config import load_config, Config
from stagent.orchestrator import TestOrchestrator
from stagent.models import TestResult, ExecutionStatus

# ============== 日志配置 ==============

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============== 应用初始化 ==============

app = FastAPI(
    title="STAgent Web API",
    description="软件测试智能体 Web 服务",
    version="0.1.0"
)

# ============== CORS 配置 ==============

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== 数据存储路径 ==============

DATA_DIR = Path(__file__).parent / "data"
PROJECTS_DIR = DATA_DIR / "projects"
REPORTS_DIR = DATA_DIR / "reports"
UPLOAD_DIR = DATA_DIR / "uploads"

for d in [DATA_DIR, PROJECTS_DIR, REPORTS_DIR, UPLOAD_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ============== 数据模型 ==============

class Project(BaseModel):
    id: str
    name: str
    description: str = ""
    config_yaml: str = ""
    created_at: str
    updated_at: str

class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    config_yaml: str = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config_yaml: Optional[str] = None

class RunRequest(BaseModel):
    project_id: str
    config_overrides: Optional[Dict[str, Any]] = None

class RunStatus(BaseModel):
    task_id: str
    status: str  # pending, running, completed, stopped, error
    progress: int
    total: int
    passed: int
    failed: int
    errors: int

# ============== 内存存储 ==============

projects: Dict[str, Project] = {}
tasks: Dict[str, Dict[str, Any]] = {}
ws_connections: Dict[str, List[WebSocket]] = {}

# ============== 工具函数 ==============

def save_project(project: Project):
    """保存项目到文件"""
    path = PROJECTS_DIR / f"{project.id}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(project.model_dump(), f, ensure_ascii=False, indent=2)

def load_projects():
    """加载所有项目"""
    global projects
    projects = {}
    for path in PROJECTS_DIR.glob("*.json"):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                project = Project(**data)
                projects[project.id] = project
        except Exception as e:
            print(f"加载项目失败 {path}: {e}")

async def broadcast(task_id: str, message: Dict[str, Any]):
    """广播消息到所有连接的客户端"""
    if task_id in ws_connections:
        disconnected = []
        for ws in ws_connections[task_id]:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            if ws in ws_connections[task_id]:
                ws_connections[task_id].remove(ws)

# 启动时加载项目
load_projects()

# ============== 健康检查 ==============

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# ============== 项目管理 API ==============

@app.get("/api/projects", response_model=List[Project])
async def list_projects():
    """获取项目列表"""
    return list(projects.values())

@app.post("/api/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    """创建新项目"""
    project_id = str(uuid.uuid4())[:8]
    now = datetime.now().isoformat()

    new_project = Project(
        id=project_id,
        name=project.name,
        description=project.description,
        config_yaml=project.config_yaml or get_default_config(),
        created_at=now,
        updated_at=now
    )

    projects[project_id] = new_project
    save_project(new_project)

    return new_project

@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """获取单个项目"""
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="项目不存在")
    return projects[project_id]

@app.put("/api/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, update: ProjectUpdate):
    """更新项目"""
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="项目不存在")

    project = projects[project_id]
    if update.name is not None:
        project.name = update.name
    if update.description is not None:
        project.description = update.description
    if update.config_yaml is not None:
        project.config_yaml = update.config_yaml

    project.updated_at = datetime.now().isoformat()
    save_project(project)

    return project

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    """删除项目"""
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="项目不存在")

    path = PROJECTS_DIR / f"{project_id}.json"
    if path.exists():
        path.unlink()

    del projects[project_id]
    return {"message": "删除成功"}

# ============== 测试运行 API ==============

@app.post("/api/run", response_model=RunStatus)
async def start_run(request: RunRequest):
    """启动测试"""
    if request.project_id not in projects:
        raise HTTPException(status_code=404, detail="项目不存在")

    task_id = str(uuid.uuid4())[:12]

    # 创建任务
    tasks[task_id] = {
        "task_id": task_id,
        "project_id": request.project_id,
        "status": "pending",
        "progress": 0,
        "total": 0,
        "passed": 0,
        "failed": 0,
        "errors": 0,
        "results": [],
        "started_at": datetime.now().isoformat(),
        "ended_at": None
    }

    # 初始化 WebSocket 连接列表
    ws_connections[task_id] = []

    # 异步执行测试
    asyncio.create_task(run_test(task_id, request.project_id, request.config_overrides))

    return RunStatus(**tasks[task_id])

@app.get("/api/run/{task_id}", response_model=RunStatus)
async def get_run_status(task_id: str):
    """获取任务状态"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")
    return RunStatus(**tasks[task_id])

@app.post("/api/run/{task_id}/stop")
async def stop_run(task_id: str):
    """停止任务"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    tasks[task_id]["status"] = "stopped"
    tasks[task_id]["ended_at"] = datetime.now().isoformat()

    return {"message": "任务已停止"}

@app.get("/api/run/{task_id}/results")
async def get_run_results(task_id: str):
    """获取任务结果"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    return {
        "task_id": task_id,
        "results": tasks[task_id]["results"]
    }

# ============== WebSocket ==============

@app.websocket("/api/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """WebSocket 实时推送"""
    await websocket.accept()

    if task_id not in ws_connections:
        ws_connections[task_id] = []
    ws_connections[task_id].append(websocket)

    try:
        # 发送当前状态
        if task_id in tasks:
            await websocket.send_json({
                "type": "status",
                "data": tasks[task_id]
            })

        # 保持连接
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        pass
    finally:
        if task_id in ws_connections and websocket in ws_connections[task_id]:
            ws_connections[task_id].remove(websocket)

# ============== 报告 API ==============

@app.get("/api/reports/{report_id}")
async def get_report(report_id: str):
    """获取报告"""
    path = REPORTS_DIR / f"{report_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="报告不存在")

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/api/reports/task/{task_id}")
async def get_report_by_task(task_id: str):
    """根据任务ID获取报告"""
    for path in REPORTS_DIR.glob("*.json"):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if data.get("task_id") == task_id:
                return data

    raise HTTPException(status_code=404, detail="报告不存在")

# ============== 覆盖率 API ==============

@app.get("/api/coverage/{report_id}")
async def get_coverage(report_id: str):
    """获取覆盖率报告"""
    path = REPORTS_DIR / f"{report_id}_coverage.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="覆盖率报告不存在")

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

# ============== 文件上传 ==============

@app.post("/api/upload/source")
async def upload_source(file: UploadFile = File(...)):
    """上传源码文件"""
    file_id = str(uuid.uuid4())[:8]
    ext = Path(file.filename).suffix
    save_path = UPLOAD_DIR / f"{file_id}{ext}"

    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {
        "file_id": file_id,
        "filename": file.filename,
        "path": str(save_path)
    }

@app.post("/api/upload/binary")
async def upload_binary(file: UploadFile = File(...)):
    """上传可执行文件"""
    file_id = str(uuid.uuid4())[:8]
    save_path = UPLOAD_DIR / f"{file_id}"

    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)

    os.chmod(save_path, 0o755)

    return {
        "file_id": file_id,
        "filename": file.filename,
        "path": str(save_path)
    }

# ============== 真正的测试执行 ==============

async def run_test(task_id: str, project_id: str, config_overrides: Optional[Dict] = None):
    """使用 STAgent 核心执行真正的测试"""
    project = projects[project_id]
    task = tasks[task_id]
    task["status"] = "running"

    await broadcast(task_id, {"type": "log", "level": "info", "message": "开始测试流程..."})
    await broadcast(task_id, {"type": "log", "level": "info", "message": f"项目: {project.name}"})

    try:
        # 1. 解析配置
        await broadcast(task_id, {"type": "log", "level": "info", "message": "解析配置文件..."})

        # 保存临时配置文件
        temp_config_path = DATA_DIR / f"temp_{task_id}.yaml"
        with open(temp_config_path, "w", encoding="utf-8") as f:
            f.write(project.config_yaml)

        # 应用覆盖
        if config_overrides:
            await broadcast(task_id, {"type": "log", "level": "info", "message": "应用配置覆盖..."})

        # 加载配置
        try:
            config = load_config(str(temp_config_path))

            # 解析程序路径为绝对路径
            program_path = Path(config.target.program)
            if not program_path.is_absolute():
                # 相对于项目根目录
                project_root = Path(__file__).parent.parent.parent
                program_path = project_root / program_path
            config.target.program = str(program_path.resolve())

        except Exception as e:
            await broadcast(task_id, {"type": "log", "level": "error", "message": f"配置解析失败: {str(e)}"})
            task["status"] = "error"
            task["ended_at"] = datetime.now().isoformat()
            await broadcast(task_id, {"type": "error", "message": str(e)})
            return

        # 2. 创建编排器
        await broadcast(task_id, {"type": "log", "level": "info", "message": "初始化测试引擎..."})

        try:
            orchestrator = TestOrchestrator(config)
        except Exception as e:
            await broadcast(task_id, {"type": "log", "level": "error", "message": f"引擎初始化失败: {str(e)}"})
            task["status"] = "error"
            task["ended_at"] = datetime.now().isoformat()
            await broadcast(task_id, {"type": "error", "message": str(e)})
            return

        # 3. 生成用例
        await broadcast(task_id, {"type": "log", "level": "info", "message": "生成测试用例..."})

        try:
            test_cases = orchestrator.generator.generate()
            task["total"] = len(test_cases)
            await broadcast(task_id, {"type": "log", "level": "info", "message": f"生成了 {len(test_cases)} 个测试用例"})
        except Exception as e:
            await broadcast(task_id, {"type": "log", "level": "error", "message": f"用例生成失败: {str(e)}"})
            task["status"] = "error"
            task["ended_at"] = datetime.now().isoformat()
            await broadcast(task_id, {"type": "error", "message": str(e)})
            return

        # 4. 去重
        if orchestrator.dedup_config.enabled:
            original_count = len(test_cases)
            test_cases = orchestrator.deduplicator.deduplicate(test_cases)
            if len(test_cases) < original_count:
                task["total"] = len(test_cases)
                await broadcast(task_id, {
                    "type": "log",
                    "level": "info",
                    "message": f"去重: {original_count} -> {len(test_cases)} 个用例"
                })

        # 5. 执行测试
        await broadcast(task_id, {"type": "log", "level": "info", "message": "开始执行测试..."})

        results = []
        for i, test_case in enumerate(test_cases):
            if task["status"] == "stopped":
                await broadcast(task_id, {"type": "log", "level": "warning", "message": "测试被用户停止"})
                break

            task["progress"] = i + 1

            # 执行单个用例
            execution = orchestrator.executor.execute(test_case)

            # 分析结果
            result = orchestrator.analyzer.analyze(test_case, execution)
            results.append(result)

            # 更新任务状态
            if result.passed:
                task["passed"] += 1
            elif result.execution.status in [ExecutionStatus.TIMEOUT, ExecutionStatus.ERROR, ExecutionStatus.CRASH]:
                task["errors"] += 1
            else:
                task["failed"] += 1

            # 广播进度
            await broadcast(task_id, {
                "type": "progress",
                "data": {
                    "progress": task["progress"],
                    "total": task["total"],
                    "passed": task["passed"],
                    "failed": task["failed"],
                    "errors": task["errors"]
                }
            })

            # 广播单个结果
            await broadcast(task_id, {
                "type": "result",
                "data": {
                    "test_case_id": result.test_case_id,
                    "passed": result.passed,
                    "status": result.execution.status.value,
                    "duration": result.execution.duration,
                    "reason": result.reason,
                    "stdout": result.execution.stdout[:500],
                    "stderr": result.execution.stderr[:200] if result.execution.stderr else "",
                    "assertions": {
                        "total": len(result.assertion_results),
                        "passed": sum(1 for a in result.assertion_results if a.passed),
                        "failed": sum(1 for a in result.assertion_results if not a.passed)
                    }
                }
            })

            # 短暂延迟，避免阻塞
            await asyncio.sleep(0.05)

        # 6. 完成
        task["status"] = "completed"
        task["ended_at"] = datetime.now().isoformat()

        # 生成报告
        report = orchestrator.analyzer.generate_report(results)

        # 保存报告
        report_data = {
            "report_id": task_id,
            "task_id": task_id,
            "project_id": project_id,
            "project_name": project.name,
            "created_at": task["started_at"],
            "total": report.total,
            "passed": report.passed,
            "failed": report.failed,
            "errors": report.errors,
            "summary": report.summary,
            "results": [
                {
                    "test_case_id": r.test_case_id,
                    "passed": r.passed,
                    "status": r.execution.status.value,
                    "duration": r.execution.duration,
                    "reason": r.reason,
                    "stdout": r.execution.stdout[:500],
                    "stderr": r.execution.stderr[:200] if r.execution.stderr else "",
                    "assertions": {
                        "total": len(r.assertion_results),
                        "passed": sum(1 for a in r.assertion_results if a.passed),
                        "failed": sum(1 for a in r.assertion_results if not a.passed),
                        "details": [
                            {
                                "type": a.assertion_type,
                                "passed": a.passed,
                                "message": a.message
                            }
                            for a in r.assertion_results
                        ]
                    }
                }
                for r in results
            ]
        }

        report_path = REPORTS_DIR / f"{task_id}.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)

        # 清理临时文件
        if temp_config_path.exists():
            temp_config_path.unlink()

        await broadcast(task_id, {"type": "log", "level": "success", "message": f"测试完成! 通过率: {report.summary.get('pass_rate', 'N/A')}"})
        await broadcast(task_id, {"type": "completed", "data": report_data})

    except Exception as e:
        logger.error(f"测试执行异常: {e}")
        import traceback
        traceback.print_exc()
        task["status"] = "error"
        task["ended_at"] = datetime.now().isoformat()
        await broadcast(task_id, {"type": "log", "level": "error", "message": f"执行异常: {str(e)}"})
        await broadcast(task_id, {"type": "error", "message": str(e)})

# ============== 辅助函数 ==============

def get_default_config() -> str:
    """获取默认配置模板"""
    # 项目根目录
    project_root = Path(__file__).parent.parent.parent
    examples_dir = project_root / "examples"
    results_dir = project_root / "results"
    results_dir.mkdir(exist_ok=True)

    return f'''target:
  program: "{examples_dir / "sort.exe"}"
  timeout: 10

wrapper:
  enabled: true
  input_schema:
    - name: numbers
      type: "list[int]"
      count_fixed: 5
      range_min: -100
      range_max: 100
      separator: "\\n"

analysis:
  compare_mode: "fuzzy"
  report_format: "json"
  default_assertions:
    - type: "no_error"

  deduplication:
    enabled: true

  coverage:
    enabled: false

generation:
  strategy: "wrapper"
  count: 10

output:
  report_path: "{results_dir / "report.json"}"
  log_level: "INFO"
'''

# ============== 启动 ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
