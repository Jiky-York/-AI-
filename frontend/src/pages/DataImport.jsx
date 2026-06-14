import React, { useState, useRef } from 'react'
import { 
  Upload, 
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2
} from 'lucide-react'
import * as XLSX from 'xlsx'

function DataImport() {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [error, setError] = useState(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (selectedFile) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx', '.xls', '.csv'
    ]
    
    const extension = selectedFile.name.split('.').pop().toLowerCase()
    if (!validTypes.includes(selectedFile.type) && !validTypes.includes(`.${extension}`)) {
      setError('请上传Excel或CSV文件（.xlsx, .xls, .csv）')
      return
    }

    setFile(selectedFile)
    setError(null)
    setUploadSuccess(false)

    // 预览数据
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        
        setPreviewData({
          sheets: workbook.SheetNames,
          rows: jsonData.length,
          columns: jsonData[0]?.length || 0,
          preview: jsonData.slice(0, 6) // 前6行预览
        })
      } catch (err) {
        setError('文件格式错误，无法解析')
      }
    }
    reader.readAsArrayBuffer(selectedFile)
  }

  const handleUpload = async () => {
    setUploading(true)
    // 模拟上传
    await new Promise(resolve => setTimeout(resolve, 2000))
    setUploading(false)
    setUploadSuccess(true)
  }

  const downloadTemplate = () => {
    const templateData = [
      ['项目编号', '客户类型', '项目阶段', '预算(万元)', '已发生成本(万元)', '计划周期(天)', '已用天数', '验收风险', '质量问题数', '客户满意度'],
      ['P001', '科技服务', '验收前', 42, 36, 60, 55, '中', 2, 4.2],
      ['P002', '咨询交付', '执行中', 28, 31, 45, 42, '高', 5, 3.1],
    ]
    
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '项目数据')
    
    XLSX.writeFile(wb, '项目数据导入模板.xlsx')
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">数据导入</h1>
        <p className="text-text-secondary">上传Excel或CSV文件，批量导入项目数据</p>
      </div>

      {/* Upload Area */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          上传文件
        </h2>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
            ${dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary hover:bg-surface-2'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="w-12 h-12 text-success" />
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-text-secondary">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="font-medium mb-2">点击或拖拽文件到此处</p>
              <p className="text-sm text-text-secondary">
                支持 .xlsx, .xls, .csv 格式
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-danger/10 border border-danger/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-danger" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {previewData && (
          <div className="mt-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-success" />
                文件预览
              </h3>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span>工作表：{previewData.sheets.join(', ')}</span>
                <span>行数：{previewData.rows}</span>
                <span>列数：{previewData.columns}</span>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {previewData.preview[0]?.map((header, idx) => (
                      <th key={idx}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.preview.slice(1).map((row, idx) => (
                    <tr key={idx}>
                      {row.map((cell, cidx) => (
                        <td key={cidx}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {file && !uploadSuccess && (
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在导入...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  开始导入
                </>
              )}
            </button>
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-6 p-4 rounded-lg bg-success/10 border border-success/30 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <div>
                <p className="font-medium text-success">导入成功！</p>
                <p className="text-sm text-text-secondary mt-1">
                  已成功导入 {previewData?.rows - 1} 条项目记录
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Download */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">下载导入模板</h2>
        <p className="text-sm text-text-secondary mb-4">
          使用标准模板格式导入数据，确保字段匹配
        </p>
        <button
          onClick={downloadTemplate}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          下载Excel模板
        </button>
      </div>

      {/* Data Format */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">数据格式说明</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">必填字段</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• 项目编号（唯一标识）</li>
              <li>• 客户类型</li>
              <li>• 项目阶段</li>
              <li>• 预算金额（万元）</li>
              <li>• 已发生成本（万元）</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-3">可选字段</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• 计划周期（天）</li>
              <li>• 已用天数</li>
              <li>• 验收风险（低/中/高）</li>
              <li>• 质量问题数</li>
              <li>• 客户满意度（1-5分）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataImport
