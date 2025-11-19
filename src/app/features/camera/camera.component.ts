// import { Component, OnDestroy, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { CameraService } from '../../core/services/camera.service';

// @Component({
//   selector: 'app-camera',
//   templateUrl: './camera.component.html',
//   styleUrls: ['./camera.component.scss'],
// })
// export class CameraComponent implements OnInit, OnDestroy {

//   isLoading = true;

//   constructor(private cameraService: CameraService, private router: Router) {}

//   async ngOnInit() {
//     await this.cameraService.startCamera();
//     this.isLoading = false;
//   }

//   ngOnDestroy() {
//     this.cameraService.stopCamera();
//   }

//   capture() {
//     const photo = this.cameraService.capturePhoto();
//     this.router.navigate(['/camera/results'], { state: { photo } });
//   }
// }
