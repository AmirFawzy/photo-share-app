import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { Items, MenuDimension } from '../user/user.component';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

@Component({
  selector: 'ps-more-menu',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.scss']
})
export class MoreComponent implements OnInit {
  @ViewChild('menuContainer', { static: true }) menuContainerEle: ElementRef;
  itemsList1: Items[] = [{
    text: 'trending',
    routePath: '/trends'
  },
  {
    text: 'blog',
    routePath: '/'
  },
  {
    text: 'jobs',
    routePath: '/jobs'
  },
  {
    text: 'license',
    routePath: '/'
  },
  {
    text: 'contest',
    routePath: '/'
  }];
  itemsList2: Items[] = [{
    text: 'about us',
    routePath: '/'
  },
  {
    text: 'contact us',
    routePath: '/'
  }];
  config: PerfectScrollbarConfigInterface = {};
  menuSize: MenuDimension;

  constructor() { }

  ngOnInit() {
    this.menuSize = {
      width: this.menuContainerEle.nativeElement.clientWidth,
      height: this.menuContainerEle.nativeElement.clientHeight
    };
  }

}
