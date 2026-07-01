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
