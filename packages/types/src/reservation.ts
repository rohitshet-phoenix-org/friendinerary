export type ReservationType = "flight" | "hotel" | "rental_car" | "activity";
export type ReservationSource = "email_forward" | "gmail_scan" | "manual";

export interface FlightReservation {
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  confirmationCode: string | null;
  seatNumber: string | null;
  cabinClass: string | null;
}

export interface HotelReservation {
  hotelName: string;
  address: string | null;
  checkInDate: string;
  checkOutDate: string;
  confirmationCode: string | null;
  roomType: string | null;
  guestCount: number | null;
}

export interface CarRentalReservation {
  vendor: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  dropoffTime: string;
  confirmationCode: string | null;
  carClass: string | null;
}

export interface ActivityReservation {
  activityName: string;
  location: string | null;
  startTime: string;
  endTime: string | null;
  confirmationCode: string | null;
  provider: string | null;
}

export interface Reservation {
  id: string;
  tripId: string;
  type: ReservationType;
  source: ReservationSource;
  rawEmailId: string | null;
  linkedPlaceId: string | null;
  details: FlightReservation | HotelReservation | CarRentalReservation | ActivityReservation;
  attachedDocuments: string[];
  status: "confirmed" | "cancelled" | "pending";
  createdAt: string;
  updatedAt: string;
}
