class WebSocketClient {
  constructor() {
    this.socket = null
    this.taskId = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect(taskId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.disconnect()
    }

    this.taskId = taskId
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    const port = 8000
    const url = `${protocol}//${host}:${port}/api/ws/${taskId}`

    this.socket = new WebSocket(url)

    this.socket.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.emit('connected', {})
    }

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.emit(data.type, data.data || data)
      } catch (e) {
        console.error('WebSocket parse error:', e)
      }
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', { error })
    }

    this.socket.onclose = () => {
      console.log('WebSocket closed')
      this.emit('disconnected', {})

      // 自动重连
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => {
          if (this.taskId) {
            console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
            this.connect(this.taskId)
          }
        }, 1000 * this.reconnectAttempts)
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.taskId = null
      this.socket.close()
      this.socket = null
    }
  }

  // 事件监听
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
    return () => this.off(event, callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data))
    }
  }

  // 发送心跳
  ping() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send('ping')
    }
  }
}

export const wsClient = new WebSocketClient()
export default wsClient
