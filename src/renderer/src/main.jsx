import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Toaster } from './components/ui/sonner'
import './App.css'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" richColors />
  </React.StrictMode>
)
