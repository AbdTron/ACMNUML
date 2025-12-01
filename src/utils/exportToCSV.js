/**
 * Export data to CSV format
 */

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Optional array of header names
 * @returns {string} CSV string
 */
export const convertToCSV = (data, headers = null) => {
  if (!data || data.length === 0) {
    return ''
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0])
  
  // Create header row
  const headerRow = csvHeaders.map(header => `"${String(header).replace(/"/g, '""')}"`).join(',')
  
  // Create data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header]
      if (value === null || value === undefined) {
        return '""'
      }
      // Handle dates
      if (value instanceof Date) {
        return `"${value.toISOString()}"`
      }
      // Handle arrays and objects
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      }
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  })
  
  return [headerRow, ...dataRows].join('\n')
}

/**
 * Download CSV file
 * @param {string} csvContent - CSV string content
 * @param {string} filename - Filename for download
 */
export const downloadCSV = (csvContent, filename = 'export.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Export registrations to CSV
 * @param {Array} registrations - Array of registration objects
 * @param {string} eventTitle - Event title for filename
 */
export const exportRegistrationsToCSV = (registrations, eventTitle = 'registrations') => {
  if (!registrations || registrations.length === 0) {
    alert('No registrations to export')
    return
  }

  // Flatten registration data for CSV
  const csvData = registrations.map(reg => {
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

  const csvContent = convertToCSV(csvData)
  const filename = `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_registrations_${new Date().toISOString().split('T')[0]}.csv`
  downloadCSV(csvContent, filename)
}

















