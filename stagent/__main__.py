"""支持 python -m stagent 运行"""
from .cli import main
if __name__ == "__main__":
    import sys
    sys.exit(main())
