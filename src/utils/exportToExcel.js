/**
 * Export data to Excel format
 * Note: This is a simplified version. For full Excel support, install 'xlsx' package:
 * npm install xlsx
 */

/**
 * Export registrations to Excel (CSV format as fallback)
 * For full Excel support, uncomment the xlsx implementation below
 * @param {Array} registrations - Array of registration objects
 * @param {string} eventTitle - Event title for filename
 */
export const exportRegistrationsToExcel = (registrations, eventTitle = 'registrations') => {
  // For now, export as CSV (which Excel can open)
  // To enable full Excel support, install xlsx: npm install xlsx
  // Then uncomment the code below
  
  if (!registrations || registrations.length === 0) {
    alert('No registrations to export')
    return
  }

  // Flatten registration data
  const excelData = registrations.map(reg => {
    const row = {
      'Registration ID': reg.id,
      'Name': reg.name || reg.userName || '',
      'Email': reg.email || reg.userEmail || '',
      'Status': reg.status || 'pending',
      'Registered At': reg.registeredAt ? new Date(reg.registeredAt).toLocaleString() : '',
      'Checked In': reg.checkedIn ? 'Yes' : 'No',
      'Check-in Time': reg.checkInTime ? new Date(reg.checkInTime).toLocaleString() : ''
    }
    
    // Add form responses
    if (reg.formData && typeof reg.formData === 'object') {
      Object.keys(reg.formData).forEach(key => {
        const value = reg.formData[key]
        row[key] = Array.isArray(value) ? value.join(', ') : String(value)
      })
    }
    
    return row
  })

  // Convert to CSV (Excel can open CSV files)
  const headers = Object.keys(excelData[0])
  const csvRows = [
    headers.join(','),
    ...excelData.map(row => 
      headers.map(header => {
        const value = row[header]
        return `"${String(value || '').replace(/"/g, '""')}"`
      }).join(',')
    )
  ]
  
  const csvContent = csvRows.join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }) // BOM for Excel
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_registrations_${new Date().toISOString().split('T')[0]}.xlsx`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)

  /* 
  // Full Excel support with xlsx package (uncomment after installing xlsx)
  import * as XLSX from 'xlsx'
  
  const ws = XLSX.utils.json_to_sheet(excelData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Registrations')
  
  const filename = `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_registrations_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
  */
}


















