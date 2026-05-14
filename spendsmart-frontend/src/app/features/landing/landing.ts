import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: false,
  templateUrl: './landing.html',
  styleUrls: ['./landing.scss']
})
export class LandingComponent {
  activeFeature: string = 'analytics';

  faqs = [
    {
      question: 'Is my financial data secure?',
      answer: 'Yes, SpendSmart uses a secure Spring Boot backend and encrypted databases to ensure your data is always protected.',
      isOpen: false
    },
    {
      question: 'Can I automate monthly payments?',
      answer: 'Absolutely. Our Recurring Transactions engine handles rent, salary, and SIPs automatically so you never miss a beat.',
      isOpen: false
    },
    {
      question: 'How do the budget alerts work?',
      answer: 'You will receive instant critical warnings the moment you cross 85% of your defined category limit.',
      isOpen: false
    }
  ];

  constructor(private router: Router) {}

  setActiveFeature(featureId: string) {
    this.activeFeature = featureId;
  }

  toggleFaq(index: number) {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
