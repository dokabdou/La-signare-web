import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
})
export class AccountComponent implements OnInit {
  user: any = null;
  phone = '';
  password = '';
  message = '';
  loading = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Automatically load the current user's data into the form
    this.authService.currentUser$.subscribe((u) => {
      if (u) {
        this.user = u;
        this.phone = u.phone || '';
        this.password = u.password || '';
      }
    });
  }

  save() {
    if (!this.password) {
      this.message = 'Password cannot be empty.';
      return;
    }
    this.loading = true;
    this.message = '';

    const updatedUser = {
      ...this.user,
      phone: this.phone,
      password: this.password,
    };

    this.authService.updateUser(this.user.id, updatedUser).subscribe(() => {
      this.loading = false;
      this.message = 'Account updated successfully!';
      setTimeout(() => (this.message = ''), 3000);
    });
  }
}
