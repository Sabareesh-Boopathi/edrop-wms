// Utility functions for bin management
import { Bin, Rack, Warehouse } from '../types';

/**
 * Formats a bin code in the standard format: [warehouse_code]-[rack_code]-S[stack]-B[bin]
 * @param bin - The bin object
 * @param rack - The rack object
 * @param warehouse - The warehouse object
 * @returns Formatted bin code or fallback
 */
export function formatBinCode(
  bin: { stack_index: number; bin_index: number; code?: string },
  rack?: { name?: string; id?: string },
  warehouse?: { name?: string; id?: string }
): string {
  // If bin already has a properly formatted code, use it
  if (bin.code && bin.code.includes('-') && bin.code.length > 10) {
    return bin.code;
  }

  // Generate proper format: ESW-R003-S001-B001
  const warehouseCode = warehouse?.name?.substring(0, 3).toUpperCase() || 'WH';
  const rackCode = rack?.name || `R${(rack?.id || '').substring(0, 3).padStart(3, '0')}`;
  const stackCode = `S${String(bin.stack_index + 1).padStart(3, '0')}`;
  const binCode = `B${String(bin.bin_index + 1).padStart(3, '0')}`;
  
  return `${warehouseCode}-${rackCode}-${stackCode}-${binCode}`;
}

/**
 * Checks if a rack is available for allocation (not in maintenance)
 * @param rack - The rack object
 * @returns true if rack is available
 */
export function isRackAvailable(rack: { status?: string }): boolean {
  return rack.status !== 'maintenance' && rack.status !== 'inactive';
}

/**
 * Checks if a bin is available for allocation
 * @param bin - The bin object
 * @returns true if bin is available
 */
export function isBinAvailable(bin: { status?: string }): boolean {
  return bin.status === 'empty' || bin.status === 'available';
}

/**
 * Gets the proper allocation status based on bin assignments
 * @param lines - Array of receipt lines
 * @returns allocation status
 */
export function getAllocationStatus(lines: Array<{ bin_id?: string; bin_code?: string }>): 'Not Started' | 'Partial' | 'Allocated' {
  const totalLines = lines.length;
  // Consider a line allocated only when both id and human-friendly code are available
  const allocatedLines = lines.filter(l => l.bin_id && l.bin_code).length;
  
  if (allocatedLines === 0) return 'Not Started';
  if (allocatedLines === totalLines) return 'Allocated';
  return 'Partial';
}
