import { NgModule } from '@angular/core';

import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { fas, faHome, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import {
  fab,
  faFacebookF,
  faTwitter,
  faInstagram,
  faTumblr,
  faGoogle,
  faMediumM,
  faLinkedinIn,
  faPinterestP,
  faRedditAlien
} from '@fortawesome/free-brands-svg-icons';

@NgModule({
  declarations: [],
  imports: [FontAwesomeModule],
  exports: [FontAwesomeModule]
})
export class FontIconsModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, fab);
    library.addIcons(faHome);
    library.addIcons(faEnvelope);
    library.addIcons(faFacebookF);
    library.addIcons(faTwitter);
    library.addIcons(faInstagram);
    library.addIcons(faTumblr);
    library.addIcons(faGoogle);
    library.addIcons(faMediumM);
    library.addIcons(faLinkedinIn);
    library.addIcons(faPinterestP);
    library.addIcons(faRedditAlien);
  }
}
