/* ═══════════════════════════════════════════════════════════
   FONEVI — js/export.js
   Lógica compartida para exportación de datos (Excel/PDF)
   ═══════════════════════════════════════════════════════════ */

const Exporter = {
  // Función auxiliar para obtener la lista actual filtrada de cualquier tabla
  getFilteredData(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return [];
    
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    return rows.filter(r => r.style.display !== "none").map(r => {
      return Array.from(r.querySelectorAll("td")).map(td => td.textContent.trim());
    });
  }
};

console.log("Export module loaded.");
