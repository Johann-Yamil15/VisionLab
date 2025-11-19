// import { Component } from '@angular/core';
// import { Router } from '@angular/router';
// import { GeminiService } from '../app/core/services/gemini.service';
// import { AnalysisResult } from '../app/shared/models/analysis-result.model';

// @Component({
//   selector: 'app-results',
//   templateUrl: './results.component.html',
//   styleUrls: ['./results.component.scss']
// })
// export class ResultsComponent {

//   photo = '';
//   result?: AnalysisResult;
//   loading = true;

//   constructor(private router: Router, private gemini: GeminiService) {
//     const nav = this.router.getCurrentNavigation();
//     this.photo = nav?.extras.state?.['photo'] ?? '';

//     this.gemini.analyze(this.photo).subscribe({
//       next: (res: AnalysisResult) => {
//         this.result = res;
//         this.loading = false;
//       },
//       error: () => {
//         this.loading = false;
//         alert('Error al analizar la imagen.');
//       }
//     });
//   }
// }
