export function useExportExcel() {
  async function exportTableToExcel(tableData, filename) {
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(tableData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tabela')
    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }

  return { exportTableToExcel }
}
