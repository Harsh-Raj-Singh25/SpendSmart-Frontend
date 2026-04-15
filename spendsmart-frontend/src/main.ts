// import { bootstrapApplication } from '@angular/platform-browser';
// import { AppModule } from './app/app.config';
// import { AppComponent } from './app/app';

// bootstrapApplication(AppComponent, AppModule)
//   .catch((err) => console.error(err));

// import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// import { AppModule } from './app/app.config'; // This points to the file where you defined @NgModule

// platformBrowserDynamic().bootstrapModule(AppModule)
//   .catch(err => console.error(err));

// NgModule-based bootstrapping — matches our AppModule setup
// platformBrowserDynamic() creates the browser platform and boots the root module
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.config';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));