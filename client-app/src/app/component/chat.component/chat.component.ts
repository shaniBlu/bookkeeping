import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Nl2brPipe } from '../../pipes/nl2br.pipe';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    Nl2brPipe,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {

  showEmoji = false;
  uploadedFile: File | null = null;
  question = '';
  loading = false;

  messages: any[] = [];
  chatList: any[] = [];
  selectedChatId: string | null = null;
  sidebarOpen = true;

  // ================
  // 🎤 הקלטת קול
  // ================
  isRecording = false;
  recognition: any = null;

  constructor(private http: HttpClient) {
    this.loadChats();
    this.setupSpeechRecognition();
  }

  setupSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("הדפדפן לא תומך בזיהוי דיבור");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = "he-IL";
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      this.question += (this.question ? ' ' : '') + text;
    };

    this.recognition.onstart = () => {
      this.isRecording = true;
    };

    this.recognition.onend = () => {
      this.isRecording = false;
    };
  }

  startVoice() {
    if (!this.recognition) {
      alert("הדפדפן שלך לא תומך בזיהוי דיבור");
      return;
    }

    if (this.isRecording) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  // ================
  // שאר הפונקציות
  // ================
  loadChats() {
    this.http.get<any[]>('http://localhost:5000/api/chat')
      .subscribe(res => this.chatList = res);
  }

  toggleEmoji() {
    this.showEmoji = !this.showEmoji;
  }

  addEmoji(e: string) {
    this.question += e;
    this.showEmoji = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.uploadedFile = file;
  }

  send() {
    if (!this.question.trim() && !this.uploadedFile) return;

    const q = this.question;
    this.messages.push({ from: 'user', text: q });
    this.question = '';
    this.loading = true;

    const formData = new FormData();
    formData.append('chatId', this.selectedChatId || '');
    formData.append('message', q);

    if (this.uploadedFile) {
      formData.append('file', this.uploadedFile);
      this.uploadedFile = null;
    }

    this.http.post<any>('http://localhost:5000/api/chat/send', formData)
      .subscribe(res => {
        this.loading = false;
        this.messages.push({ from: 'bot', text: res.reply });
        this.selectedChatId = res.chatId;
        this.loadChats();
      });
  }

  newChat() {
    this.http.post<any>('http://localhost:5000/api/chat/new', {})
      .subscribe(res => {
        this.selectedChatId = res._id;
        this.messages = [];
        this.loadChats();
      });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  deleteChat(id: string, event: any) {
    event.stopPropagation();
    this.http.delete('http://localhost:5000/api/chat/' + id)
      .subscribe(() => {
        if (this.selectedChatId === id) {
          this.messages = [];
          this.selectedChatId = null;
        }
        this.loadChats();
      });
  }

  loadChat(chat: any) {
    this.selectedChatId = chat._id;

    this.http.get<any[]>('http://localhost:5000/api/chat/messages/' + chat._id)
      .subscribe(res => {
        this.messages = res;
      });
  }

  enterSend(e: any) {
    e.preventDefault();
    this.send();
  }
}
