import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CampusDataService } from '../../core/services/campus-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Building, Room, QrCode } from '../../core/models/campus.model';
import * as QRCode from 'qrcode';

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
  qrCodeDataUrls = signal<{[key: string]: string}>({});

  switchTab(tabName: string) {
    this.activeTab.set(tabName);
  }

  // Modals Visibility
  showRoomModal = signal<boolean>(false);
  showBuildingModal = signal<boolean>(false);
  showQrModal = signal<boolean>(false);

  // Form Models
  roomForm = signal<any>({ number: '', name: '', type: 'classroom', x: 0, y: 0, qrCodeId: '', isFree: true, currentSubject: '', occupiedBy: '' });
  buildingForm = signal<any>({ name: '', code: '', totalFloors: 1, latitude: 0, longitude: 0 });
  qrForm = signal<any>({ code: '', locationName: '', targetRoomId: '', targetBuildingId: 'MainBlock', targetFloorId: 'Floor3' });

  // Operations
  openRoomModal() {
    this.roomForm.set({ number: '', name: '', type: 'classroom', x: 0, y: 0, qrCodeId: '', isFree: true, currentSubject: '', occupiedBy: '' });
    this.showRoomModal.set(true);
  }

  async saveRoom() {
    if (!this.authService.isAdmin()) {
      alert('Access Denied: Only administrators can add rooms.');
      return;
    }
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
    if (!this.authService.isAdmin()) {
      alert('Access Denied: Only administrators can delete rooms.');
      return;
    }
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
    if (!this.authService.isAdmin()) {
      alert('Access Denied: Only administrators can add buildings.');
      return;
    }
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
    if (!this.authService.isAdmin()) {
      alert('Access Denied: Only administrators can delete buildings.');
      return;
    }
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
    if (!this.authService.isAdmin()) {
      alert('Access Denied: Only administrators can add QR codes.');
      return;
    }
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
    if (!this.authService.isAdmin()) {
      alert('Access Denied: Only administrators can delete QR codes.');
      return;
    }
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
    
    this.campusService.getBuildings().subscribe({
      next: (b) => this.buildings.set(b),
      error: (e) => console.error('Error fetching buildings', e)
    });

    this.campusService.getQrCodes().subscribe({
      next: async (q) => {
        this.qrCodes.set(q);
        
        // Generate QR code images dynamically when gates load
        const urls: {[key: string]: string} = {};
        for (const qr of q) {
          if (qr.id) {
            urls[qr.id] = await this.generateQrUrl(qr.id);
          }
        }
        this.qrCodeDataUrls.set(urls);
      },
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

  async generateQrUrl(gateId: string): Promise<string> {
    const targetUrl = `https://college-compass-cc.vercel.app/ar-map.html?gate=${gateId}`;
    try {
      return await QRCode.toDataURL(targetUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('Failed to generate QR Code:', err);
      return '';
    }
  }

  downloadQrCode(qr: QrCode) {
    const dataUrl = this.qrCodeDataUrls()[qr.id || ''];
    if (!dataUrl) return;
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `gate-${qr.id || 'code'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printQrCode(qr: QrCode) {
    const dataUrl = this.qrCodeDataUrls()[qr.id || ''];
    if (!dataUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Label - ${qr.locationName}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .label-card {
              border: 3px double #000;
              padding: 30px;
              border-radius: 12px;
              max-width: 400px;
            }
            img {
              width: 250px;
              height: 250px;
            }
            h1 {
              font-size: 24px;
              margin: 10px 0 5px 0;
            }
            p {
              font-size: 14px;
              color: #555;
              margin: 0 0 15px 0;
            }
            .scan-tip {
              font-size: 11px;
              color: #888;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="label-card">
            <div class="scan-tip">Scan to Navigate</div>
            <h1>COLLEGE COMPASS</h1>
            <p>${qr.locationName} (${qr.id})</p>
            <img src="${dataUrl}" alt="QR Code Label">
            <div style="font-size: 10px; color: #999; margin-top: 10px;">Destination Room: ${qr.targetRoomId}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  onCanvasClick(event: MouseEvent) {
    const svg = event.currentTarget as SVGGraphicsElement;
    const rect = svg.getBoundingClientRect();
    
    // Scale relative mouse click coordinates to fit 800x400 viewBox
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 800);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 400);
    
    // Pre-populate coordinate model and open Add Room modal
    this.roomForm.update(form => ({
      ...form,
      number: '',
      name: '',
      type: 'classroom',
      x: x,
      y: y,
      qrCodeId: '',
      isFree: true,
      currentSubject: '',
      occupiedBy: ''
    }));
    this.showRoomModal.set(true);
  }

  seedingStatus = signal<string | null>(null);

  async seedData() {
    if (!this.authService.isAdmin()) {
      alert('Access Denied: Only administrators can seed the database.');
      return;
    }
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
