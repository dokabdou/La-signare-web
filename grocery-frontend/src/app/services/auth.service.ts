import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isBrowser = typeof window !== 'undefined';
  private admin = new BehaviorSubject<boolean>(this.isBrowser && !!localStorage.getItem('isAdmin'));
  isAdmin$ = this.admin.asObservable();

  toggleAdmin() {
    const v = !this.admin.value;
    this.admin.next(v);
    if (this.isBrowser) {
      if (v) localStorage.setItem('isAdmin', '1');
      else localStorage.removeItem('isAdmin');
    }
  }
}
