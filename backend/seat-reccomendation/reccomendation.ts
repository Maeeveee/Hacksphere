// TypeScript types for seat recommendation system

export interface Seat {
  id: string;
  coach: string;
  position: "Window" | "Aisle";
  nearToilet: boolean;
  nearDoor: boolean;
  legroom: number; // 1-10 scale
  price: number;
}

export interface UserPreference {
  budget: number;
  seatPosition?: "Window" | "Aisle";
  priority: "Comfort" | "QuickExit" | "Quiet" | "ScenicView";
}

// Dummy dataset of seats with varied attributes
export const dummySeats: Seat[] = [
  {
    id: "A1",
    coach: "Coach A",
    position: "Window",
    nearToilet: false,
    nearDoor: true,
    legroom: 8,
    price: 120
  },
  {
    id: "A2",
    coach: "Coach A",
    position: "Aisle",
    nearToilet: false,
    nearDoor: true,
    legroom: 7,
    price: 100
  },
  {
    id: "B3",
    coach: "Coach B",
    position: "Window",
    nearToilet: true,
    nearDoor: false,
    legroom: 6,
    price: 80
  },
  {
    id: "B4",
    coach: "Coach B",
    position: "Aisle",
    nearToilet: true,
    nearDoor: false,
    legroom: 9,
    price: 110
  },
  {
    id: "C5",
    coach: "Coach C",
    position: "Window",
    nearToilet: false,
    nearDoor: false,
    legroom: 10,
    price: 150
  },
  {
    id: "C6",
    coach: "Coach C",
    position: "Aisle",
    nearToilet: false,
    nearDoor: false,
    legroom: 5,
    price: 70
  },
  {
    id: "D7",
    coach: "Coach D",
    position: "Window",
    nearToilet: false,
    nearDoor: true,
    legroom: 4,
    price: 60
  },
  {
    id: "D8",
    coach: "Coach D",
    position: "Aisle",
    nearToilet: true,
    nearDoor: true,
    legroom: 3,
    price: 50
  },
  {
    id: "E9",
    coach: "Coach E",
    position: "Window",
    nearToilet: false,
    nearDoor: false,
    legroom: 7,
    price: 90
  },
  {
    id: "E10",
    coach: "Coach E",
    position: "Aisle",
    nearToilet: false,
    nearDoor: false,
    legroom: 8,
    price: 95
  }
];

/**
 * Calculates a score for a seat based on user preferences
 * @param seat - The seat to score
 * @param userPref - User preferences for scoring
 * @returns A numerical score (higher is better)
 */
function calculateSeatScore(seat: Seat, userPref: UserPreference): number {
  let score = 0;

  // Budget scoring: closer to user budget = higher score
  // Use inverse of price difference, normalized to a 0-10 scale
  const budgetDifference = Math.abs(seat.price - userPref.budget);
  const maxBudgetScore = 10;
  const budgetScore = Math.max(0, maxBudgetScore - (budgetDifference / userPref.budget) * maxBudgetScore);
  score += budgetScore;

  // Position matching: exact match = +2 points
  if (userPref.seatPosition && seat.position === userPref.seatPosition) {
    score += 2;
  }

  // Priority-based scoring
  switch (userPref.priority) {
    case "Comfort":
      // Higher legroom = higher score (legroom is already 1-10)
      score += seat.legroom;
      break;

    case "QuickExit":
      // Near door = +3 points
      if (seat.nearDoor) {
        score += 3;
      }
      break;

    case "Quiet":
      // Far from toilet AND door = +3 points
      if (!seat.nearToilet && !seat.nearDoor) {
        score += 3;
      }
      break;

    case "ScenicView":
      // Window seat = +3 points
      if (seat.position === "Window") {
        score += 3;
      }
      break;
  }

  return score;
}

/**
 * Recommends the top 3 seats based on user preferences
 * @param userPref - User preferences for seat recommendation
 * @param seats - Array of available seats
 * @returns Array of top 3 recommended seats, sorted by score (highest first)
 */
export function recommendSeats(userPref: UserPreference, seats: Seat[] = dummySeats): Seat[] {
  // Calculate scores for all seats
  const seatsWithScores = seats.map(seat => ({
    seat,
    score: calculateSeatScore(seat, userPref)
  }));

  // Sort by score (highest first) and return top 3 seats
  return seatsWithScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.seat);
}

/**
 * Gets detailed recommendation with scores for debugging/display purposes
 * @param userPref - User preferences for seat recommendation
 * @param seats - Array of available seats
 * @returns Array of seats with their calculated scores
 */
export function getDetailedRecommendations(userPref: UserPreference, seats: Seat[] = dummySeats): Array<{seat: Seat, score: number}> {
  const seatsWithScores = seats.map(seat => ({
    seat,
    score: calculateSeatScore(seat, userPref)
  }));

  return seatsWithScores.sort((a, b) => b.score - a.score);
}

/**
 * Example usage and testing function
 */
export function exampleUsage() {
  // Example user preferences
  const comfortSeeker: UserPreference = {
    budget: 100,
    seatPosition: "Window",
    priority: "Comfort"
  };

  const quickExitUser: UserPreference = {
    budget: 80,
    priority: "QuickExit"
  };

  const quietTraveler: UserPreference = {
    budget: 120,
    seatPosition: "Aisle",
    priority: "Quiet"
  };

  const scenicViewLover: UserPreference = {
    budget: 90,
    priority: "ScenicView"
  };

  console.log("Comfort Seeker Recommendations:", recommendSeats(comfortSeeker));
  console.log("Quick Exit User Recommendations:", recommendSeats(quickExitUser));
  console.log("Quiet Traveler Recommendations:", recommendSeats(quietTraveler));
  console.log("Scenic View Lover Recommendations:", recommendSeats(scenicViewLover));
}
