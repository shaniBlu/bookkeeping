import { Component } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ComponentNameComponent } from './component/component-name/component-name.component';
import { ApiService } from './services/api';

@Component({
  selector: 'app-root',
  template: '<app-component-name></app-component-name>',
  standalone: true,
  imports: [ComponentNameComponent, HttpClientModule],
  providers: [ApiService]
})
export class AppComponent {
  title = 'client-app';
}