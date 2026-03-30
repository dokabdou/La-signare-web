import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-store-location',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './store-location.component.html',
  styleUrls: ['./store-location.component.css'],
})
export class StoreLocationComponent {
  openMap(): void {
    const address = '11 Rue de Bernières, 14000 Caen, France';
    const googleMapsUrl = `https://maps.google.com/?q=LA+SIGNARE+Épicerie+Du+Monde,+11+Rue+de+Bernières,+14000+Caen`;
    window.open(googleMapsUrl, '_blank');
  }
}
