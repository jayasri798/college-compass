import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  getDocs,
  doc,
  setDoc
} from '@angular/fire/firestore';
import { Observable, from, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Building, Floor, Room, QrCode } from '../models/campus.model';

@Injectable({
  providedIn: 'root'
})
export class CampusDataService {
  private firestore = inject(Firestore);

  // High-quality mock fallback data for final year project demonstration
  private mockBuildings: Building[] = [
    { id: 'block-a', name: 'Block A - Computer Engineering', code: 'A', totalFloors: 4, latitude: 16.3124, longitude: 80.4365 },
    { id: 'block-b', name: 'Block B - Electronics Engineering', code: 'B', totalFloors: 3, latitude: 16.3128, longitude: 80.4369 },
    { id: 'admin-block', name: 'Administrative Block', code: 'ADMIN', totalFloors: 2, latitude: 16.3120, longitude: 80.4360 }
  ];

  private mockRooms: Room[] = [
    { id: 'room-101', number: '101', name: 'Embedded Systems Lab', type: 'lab', x: 450, y: 280, qrCodeId: 'qr-gate-a', buildingId: 'block-a', floorId: 'floor-1', buildingName: 'Block A - Computer Engineering' },
    { id: 'room-102', number: '102', name: 'Advanced Coding Lab', type: 'lab', x: 120, y: 350, qrCodeId: 'qr-gate-b', buildingId: 'block-a', floorId: 'floor-1', buildingName: 'Block A - Computer Engineering' },
    { id: 'room-202', number: '202', name: 'Classroom 202', type: 'classroom', x: 230, y: 110, buildingId: 'block-a', floorId: 'floor-2', buildingName: 'Block A - Computer Engineering' },
    { id: 'room-303', number: '303', name: 'HOD Computer Science Office', type: 'office', x: 50, y: 90, buildingId: 'block-a', floorId: 'floor-3', buildingName: 'Block A - Computer Engineering' },
    { id: 'room-404', number: '404', name: 'Department Seminar Hall', type: 'seminar', x: 600, y: 400, buildingId: 'block-a', floorId: 'floor-4', buildingName: 'Block A - Computer Engineering' },
    { id: 'room-201', number: '201', name: 'VLSI Design Lab', type: 'lab', x: 310, y: 220, qrCodeId: 'qr-gate-c', buildingId: 'block-b', floorId: 'floor-2', buildingName: 'Block B - Electronics Engineering' }
  ];

  private mockQrCodes: QrCode[] = [
    { id: 'qr-gate-a', code: 'QR_GATE_A_1029', locationName: 'Main Entrance Block A', targetBuildingId: 'block-a', targetFloorId: 'floor-1', targetRoomId: 'room-101', createdAt: new Date().toISOString() },
    { id: 'qr-gate-b', code: 'QR_GATE_B_2048', locationName: 'Side Entrance Block B', targetBuildingId: 'block-b', targetFloorId: 'floor-2', targetRoomId: 'room-201', createdAt: new Date().toISOString() },
    { id: 'qr-gate-c', code: 'QR_GATE_C_4511', locationName: 'Admin Lobby Entrance', targetBuildingId: 'admin-block', targetFloorId: 'floor-1', targetRoomId: '', createdAt: new Date().toISOString() }
  ];

  /**
   * Fetches all buildings, catches error or empty to load mock
   */
  getBuildings(): Observable<Building[]> {
    try {
      const buildingsCol = collection(this.firestore, 'buildings');
      return (collectionData(buildingsCol, { idField: 'id' }) as Observable<Building[]>).pipe(
        catchError(() => {
          console.warn('Firestore buildings fetch failed. Falling back to mock data.');
          return of(this.mockBuildings);
        })
      );
    } catch (e) {
      console.warn('Firestore initialization failed. Using mock buildings.');
      return of(this.mockBuildings);
    }
  }

  /**
   * Fetches all floors for a specific building
   */
  getFloors(buildingId: string): Observable<Floor[]> {
    try {
      const floorsCol = collection(this.firestore, `buildings/${buildingId}/floors`);
      return (collectionData(floorsCol, { idField: 'id' }) as Observable<Floor[]>).pipe(
        catchError(() => of([]))
      );
    } catch (e) {
      return of([]);
    }
  }

  /**
   * Fetches all rooms for a specific floor in a building
   */
  getRooms(buildingId: string, floorId: string): Observable<Room[]> {
    try {
      const roomsCol = collection(this.firestore, `buildings/${buildingId}/floors/${floorId}/rooms`);
      return (collectionData(roomsCol, { idField: 'id' }) as Observable<Room[]>).pipe(
        catchError(() => of([]))
      );
    } catch (e) {
      return of([]);
    }
  }

  /**
   * Fetches all QR Codes
   */
  getQrCodes(): Observable<QrCode[]> {
    try {
      const qrCol = collection(this.firestore, 'qr_codes');
      return (collectionData(qrCol, { idField: 'id' }) as Observable<QrCode[]>).pipe(
        catchError(() => {
          console.warn('Firestore QR Codes fetch failed. Falling back to mock data.');
          return of(this.mockQrCodes);
        })
      );
    } catch (e) {
      console.warn('Firestore initialization failed. Using mock QR Codes.');
      return of(this.mockQrCodes);
    }
  }

  /**
   * Connects directly to active Firestore data collection stream pointing to
   * buildings/MainBlock/floors/Floor3/rooms. Falls back to mock data if empty/failed.
   */
  getAllRoomsFlat(): Observable<Room[]> {
    try {
      const roomsCol = collection(this.firestore, 'buildings/MainBlock/floors/Floor3/rooms');
      return (collectionData(roomsCol, { idField: 'id' }) as Observable<Room[]>).pipe(
        map(rooms => {
          if (rooms.length === 0) {
            console.log('No rooms in active Firestore stream. Displaying default mock data.');
            return this.mockRooms;
          }
          return rooms.map(room => ({
            ...room,
            buildingId: 'MainBlock',
            floorId: 'Floor3',
            buildingName: 'Main Block - Administrative & Tech'
          }));
        }),
        catchError((err) => {
          console.warn('Firestore live streaming failed. Falling back to mock rooms.', err);
          return of(this.mockRooms);
        })
      );
    } catch (e) {
      console.warn('Firestore stream initialization failed. Using mock rooms.');
      return of(this.mockRooms);
    }
  }

  /**
   * Seed sample data directly into the active Firestore database collections
   */
  async seedSampleData(): Promise<void> {
    try {
      // 1. Seed Main Building
      const buildingRef = doc(this.firestore, 'buildings/MainBlock');
      await setDoc(buildingRef, {
        name: 'Main Block - Administrative & Tech',
        code: 'MAIN',
        totalFloors: 5,
        latitude: 16.3122,
        longitude: 80.4362
      });

      // 2. Seed Floor 3
      const floorRef = doc(this.firestore, 'buildings/MainBlock/floors/Floor3');
      await setDoc(floorRef, {
        level: 3,
        name: 'Third Floor',
        floorPlanUrl: 'https://images.unsplash.com/photo-1541829019-259276a7f013?w=800&fit=crop'
      });

      // 3. Seed Rooms on Floor 3
      const rooms = [
        { id: 'room-301', number: '301', name: 'IoT Research Lab', type: 'lab', x: 120, y: 150, qrCodeId: 'qr-cse-lab' },
        { id: 'room-302', number: '302', name: 'CSE HOD Cabin', type: 'office', x: 280, y: 180, qrCodeId: 'qr-faculty-cs' },
        { id: 'room-303', number: '303', name: 'Mobile Computing Classroom', type: 'classroom', x: 450, y: 220, qrCodeId: 'qr-iot-class' },
        { id: 'room-304', number: '304', name: 'CSE Central Seminar Hall', type: 'seminar', x: 620, y: 350, qrCodeId: '' }
      ];

      for (const r of rooms) {
        const roomRef = doc(this.firestore, `buildings/MainBlock/floors/Floor3/rooms/${r.id}`);
        await setDoc(roomRef, {
          number: r.number,
          name: r.name,
          type: r.type,
          x: r.x,
          y: r.y,
          qrCodeId: r.qrCodeId
        });
      }

      // 4. Seed QR Codes
      const qrCodes = [
        { id: 'qr-cse-lab', code: 'QR_CSE_LAB_110', locationName: 'Main Entrance CSE Lab Wing', targetBuildingId: 'MainBlock', targetFloorId: 'Floor3', targetRoomId: 'room-301' },
        { id: 'qr-faculty-cs', code: 'QR_FACULTY_CS_112', locationName: 'Main Admin Wing Entrance', targetBuildingId: 'MainBlock', targetFloorId: 'Floor3', targetRoomId: 'room-302' },
        { id: 'qr-iot-class', code: 'QR_IOT_CLASS_115', locationName: 'Classroom Wing Entrance', targetBuildingId: 'MainBlock', targetFloorId: 'Floor3', targetRoomId: 'room-303' }
      ];

      for (const q of qrCodes) {
        const qrRef = doc(this.firestore, `qr_codes/${q.id}`);
        await setDoc(qrRef, {
          code: q.code,
          locationName: q.locationName,
          targetBuildingId: q.targetBuildingId,
          targetFloorId: q.targetFloorId,
          targetRoomId: q.targetRoomId,
          createdAt: new Date().toISOString()
        });
      }

      console.log('Firestore Database successfully seeded with College Compass Main Block (Floor 3) data.');
    } catch (error) {
      console.error('Failed to seed Firestore data:', error);
      throw error;
    }
  }
}
