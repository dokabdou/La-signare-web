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
  confirmPassword = '';
  message = '';
  isError = false;
  loading = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((u) => {
      if (u) {
        this.user = u;
        this.phone = u.phone || '';
        this.password = '';
        this.confirmPassword = '';
      }
    });
  }

  get isFormValid(): boolean {
    const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
    const isPhoneValid = phoneRegex.test(this.phone);

    const isPasswordValid = !!this.password && this.password.length >= 8;
    const passwordsMatch = this.password === this.confirmPassword;

    return !!(isPhoneValid && isPasswordValid && passwordsMatch);
  }

  save() {
    this.loading = true;
    this.message = '';
    this.isError = false;

    const updatedUser = {
      ...this.user,
      phone: this.phone.trim(),
      password: this.password,
    };

	console.log(updatedUser);

    this.authService.updateUser(this.user.id, updatedUser).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Account updated successfully!';

        this.password = '';
        this.confirmPassword = '';

        setTimeout(() => (this.message = ''), 3000);
      },
      error: (err) => {
        this.loading = false;
        this.isError = true;
        this.message = 'Failed to update account. Please try again.';
      },
    });
  }
}
