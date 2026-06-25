export interface Building {
  id?: string;
  name: string;
  code: string;
  totalFloors: number;
  latitude: number;
  longitude: number;
}

export interface Floor {
  id?: string;
  level: number;
  name: string;
  floorPlanUrl: string;
}

export interface Room {
  id?: string;
  number: string;
  name: string;
  type: 'classroom' | 'lab' | 'office' | 'seminar' | 'other';
  x: number; // relative floor coordinates
  y: number;
  qrCodeId?: string;
  buildingId?: string; // Hydrated helper field
  floorId?: string;    // Hydrated helper field
  buildingName?: string; // Hydrated helper field
}

export interface QrCode {
  id?: string;
  code: string;
  locationName: string;
  targetBuildingId: string;
  targetFloorId: string;
  targetRoomId: string;
  createdAt: string;
}
