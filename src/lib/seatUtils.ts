// Utility functions untuk seat selection

export interface SeatConfig {
  wagon: string;
  row: number;
  column: string;
  seatNumber: string;
  isOccupied: boolean;
}

// Konfigurasi seat berdasarkan kelas
const SEAT_CONFIG = {
  'Eksekutif': {
    columns: ['A', 'B', 'C', 'D'], // 2-2 configuration
    rows: 12,
    wagonPrefix: 'EKS'
  },
  'Bisnis': {
    columns: ['A', 'B', 'C', 'D'], // 2-2 configuration
    rows: 15,
    wagonPrefix: 'BIS'
  },
  'Ekonomi': {
    columns: ['A', 'B', 'C', 'D', 'E'], // 3-2 configuration
    rows: 20,
    wagonPrefix: 'EKO'
  },
  'Ekonomi Premium': {
    columns: ['A', 'B', 'C', 'D'], // 2-2 configuration
    rows: 18,
    wagonPrefix: 'EKP'
  }
};

/**
 * Generate semua kursi yang tersedia untuk kelas tertentu
 */
export function generateAvailableSeats(
  trainClass: string,
  occupiedSeats: string[] = []
): SeatConfig[] {
  const config = SEAT_CONFIG[trainClass as keyof typeof SEAT_CONFIG];
  
  if (!config) {
    console.error('Invalid train class:', trainClass);
    return [];
  }

  const seats: SeatConfig[] = [];
  const wagon = `${config.wagonPrefix}-A`; // Default wagon A

  for (let row = 1; row <= config.rows; row++) {
    for (const column of config.columns) {
      const seatNumber = `${row}${column}`;
      seats.push({
        wagon,
        row,
        column,
        seatNumber,
        isOccupied: occupiedSeats.includes(seatNumber)
      });
    }
  }

  return seats;
}

/**
 * Randomize seat selection dari kursi yang available
 */
export function randomizeSeat(
  trainClass: string,
  occupiedSeats: string[] = [],
  count: number = 1
): SeatConfig[] {
  const allSeats = generateAvailableSeats(trainClass, occupiedSeats);
  const availableSeats = allSeats.filter(seat => !seat.isOccupied);

  if (availableSeats.length === 0) {
    console.error('No available seats!');
    return [];
  }

  if (count > availableSeats.length) {
    console.warn(`Only ${availableSeats.length} seats available, requested ${count}`);
    count = availableSeats.length;
  }

  // Shuffle array and take first n seats
  const shuffled = [...availableSeats].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Generate seat yang bersebelahan (untuk kelompok)
 */
export function randomizeAdjacentSeats(
  trainClass: string,
  occupiedSeats: string[] = [],
  count: number = 1
): SeatConfig[] {
  const allSeats = generateAvailableSeats(trainClass, occupiedSeats);
  const config = SEAT_CONFIG[trainClass as keyof typeof SEAT_CONFIG];

  if (!config) return [];

  // Group seats by row
  const seatsByRow: { [key: number]: SeatConfig[] } = {};
  
  allSeats.forEach(seat => {
    if (!seat.isOccupied) {
      if (!seatsByRow[seat.row]) {
        seatsByRow[seat.row] = [];
      }
      seatsByRow[seat.row].push(seat);
    }
  });

  // Cari row yang punya cukup seats bersebelahan
  for (const row of Object.keys(seatsByRow).map(Number)) {
    const rowSeats = seatsByRow[row];
    
    if (rowSeats.length >= count) {
      // Check if seats are adjacent
      const sortedSeats = rowSeats.sort((a, b) => 
        a.column.charCodeAt(0) - b.column.charCodeAt(0)
      );

      // Find consecutive seats
      for (let i = 0; i <= sortedSeats.length - count; i++) {
        const consecutiveSeats = sortedSeats.slice(i, i + count);
        
        // Check if they are truly consecutive (A, B, C, D)
        const isConsecutive = consecutiveSeats.every((seat, index) => {
          if (index === 0) return true;
          const prevColumn = consecutiveSeats[index - 1].column.charCodeAt(0);
          const currentColumn = seat.column.charCodeAt(0);
          return currentColumn === prevColumn + 1;
        });

        if (isConsecutive) {
          return consecutiveSeats;
        }
      }
    }
  }

  // Jika tidak ada yang bersebelahan, fallback ke random
  console.warn('No adjacent seats found, using random selection');
  return randomizeSeat(trainClass, occupiedSeats, count);
}

/**
 * Check apakah seat number valid
 */
export function isValidSeat(trainClass: string, seatNumber: string): boolean {
  const config = SEAT_CONFIG[trainClass as keyof typeof SEAT_CONFIG];
  if (!config) return false;

  const row = parseInt(seatNumber.match(/\d+/)?.[0] || '0');
  const column = seatNumber.match(/[A-Z]/)?.[0] || '';

  return (
    row > 0 &&
    row <= config.rows &&
    config.columns.includes(column)
  );
}

/**
 * Get seat category (window, middle, aisle)
 */
export function getSeatCategory(column: string): 'window' | 'middle' | 'aisle' {
  if (column === 'A' || column === 'E') return 'window';
  if (column === 'B' || column === 'D') return 'middle';
  return 'aisle'; // C
}
