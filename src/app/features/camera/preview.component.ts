import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss']
})
export class PreviewComponent {
  photo: string = '';

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.photo = nav?.extras.state?.['photo'] ?? '';
  }

  analyze() {
    this.router.navigate(['/camera/results'], {
      state: { photo: this.photo }
    });
  }

  retake() {
    this.router.navigate(['/camera']);
  }
}
