import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CampusDataService } from '../../core/services/campus-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Building, Room, QrCode } from '../../core/models/campus.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private campusService = inject(CampusDataService);
  authService = inject(AuthService);

  // States using Angular Signals
  buildings = signal<Building[]>([]);
  rooms = signal<Room[]>([]);
  qrCodes = signal<QrCode[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<string>('rooms');

  switchTab(tabName: string) {
    this.activeTab.set(tabName);
  }

  // Modals Visibility
  showRoomModal = signal<boolean>(false);
  showBuildingModal = signal<boolean>(false);
  showQrModal = signal<boolean>(false);

  // Form Models
  roomForm = signal<any>({ number: '', name: '', type: 'classroom', x: 0, y: 0, qrCodeId: '' });
  buildingForm = signal<any>({ name: '', code: '', totalFloors: 1, latitude: 0, longitude: 0 });
  qrForm = signal<any>({ code: '', locationName: '', targetRoomId: '', targetBuildingId: 'MainBlock', targetFloorId: 'Floor3' });

  // Operations
  openRoomModal() {
    this.roomForm.set({ number: '', name: '', type: 'classroom', x: 0, y: 0, qrCodeId: '' });
    this.showRoomModal.set(true);
  }

  async saveRoom() {
    try {
      await this.campusService.addRoom(this.roomForm());
      this.showRoomModal.set(false);
      this.loadCampusData();
    } catch (err: any) {
      alert(`Error saving room: ${err.message}`);
    }
  }

  async deleteRoom(roomId: string | undefined, event: Event) {
    event.stopPropagation();
    if (!roomId) return;
    if (confirm('Are you sure you want to delete this room?')) {
      try {
        await this.campusService.deleteRoom(roomId);
        this.loadCampusData();
      } catch (err: any) {
        alert(`Error deleting room: ${err.message}`);
      }
    }
  }

  openBuildingModal() {
    this.buildingForm.set({ name: '', code: '', totalFloors: 1, latitude: 0, longitude: 0 });
    this.showBuildingModal.set(true);
  }

  async saveBuilding() {
    try {
      await this.campusService.addBuilding(this.buildingForm());
      this.showBuildingModal.set(false);
      this.loadCampusData();
    } catch (err: any) {
      alert(`Error saving building: ${err.message}`);
    }
  }

  async deleteBuilding(code: string, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this building?')) {
      try {
        await this.campusService.deleteBuilding(code);
        this.loadCampusData();
      } catch (err: any) {
        alert(`Error deleting building: ${err.message}`);
      }
    }
  }

  openQrModal() {
    this.qrForm.set({ code: '', locationName: '', targetRoomId: '', targetBuildingId: 'MainBlock', targetFloorId: 'Floor3' });
    this.showQrModal.set(true);
  }

  async saveQrCode() {
    try {
      await this.campusService.addQrCode(this.qrForm());
      this.showQrModal.set(false);
      this.loadCampusData();
    } catch (err: any) {
      alert(`Error saving QR Code: ${err.message}`);
    }
  }

  async deleteQrCode(qrId: string | undefined, event: Event) {
    event.stopPropagation();
    if (!qrId) return;
    if (confirm('Are you sure you want to delete this QR Code?')) {
      try {
        await this.campusService.deleteQrCode(qrId);
        this.loadCampusData();
      } catch (err: any) {
        alert(`Error deleting QR Code: ${err.message}`);
      }
    }
  }
  
  // Search & Filter State
  searchQuery = signal<string>('');
  selectedTypeFilter = signal<string>('all');

  // Computed Values for Stats Panel
  totalBuildingsCount = computed(() => this.buildings().length);
  totalRoomsCount = computed(() => this.rooms().length);
  totalQrCount = computed(() => this.qrCodes().length);
  
  // Filtered rooms logic
  filteredRooms = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.selectedTypeFilter();
    
    return this.rooms().filter(room => {
      const matchesSearch = 
        room.name.toLowerCase().includes(query) || 
        room.number.includes(query) || 
        (room.buildingName && room.buildingName.toLowerCase().includes(query));
      
      const matchesType = type === 'all' || room.type === type;
      
      return matchesSearch && matchesType;
    });
  });

  ngOnInit() {
    this.loadCampusData();
  }

  loadCampusData() {
    this.loading.set(true);
    
    // ForkJoin parallel fetches or mock loaders
    this.campusService.getBuildings().subscribe({
      next: (b) => this.buildings.set(b),
      error: (e) => console.error('Error fetching buildings', e)
    });

    this.campusService.getQrCodes().subscribe({
      next: (q) => this.qrCodes.set(q),
      error: (e) => console.error('Error fetching QR Codes', e)
    });

    this.campusService.getAllRoomsFlat().subscribe({
      next: (r) => {
        this.rooms.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        console.error('Error fetching flat rooms list', e);
        this.loading.set(false);
      }
    });
  }

  seedingStatus = signal<string | null>(null);

  async seedData() {
    this.seedingStatus.set('Seeding database...');
    try {
      await this.campusService.seedSampleData();
      this.seedingStatus.set('Success! MainBlock data seeded.');
      setTimeout(() => this.seedingStatus.set(null), 4000);
      this.loadCampusData();
    } catch (err: any) {
      console.error(err);
      this.seedingStatus.set(`Seeding failed: ${err.message || 'Check environment configuration'}`);
      setTimeout(() => this.seedingStatus.set(null), 5000);
    }
  }

  logout() {
    this.authService.logout();
  }
}
