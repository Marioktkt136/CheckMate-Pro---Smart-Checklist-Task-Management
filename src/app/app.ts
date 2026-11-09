import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NavbarComponent } from './components/navbar';
import { DashboardStatsComponent } from './components/dashboard-stats';
import { ChecklistViewComponent } from './components/checklist-view';
import { CalendarViewComponent } from './components/calendar-view';
import { AnalyticsViewComponent } from './components/analytics-view';
import { TeamChatComponent } from './components/team-chat';
import { ItemModalComponent } from './components/item-modal';
import { AiAdvisorModalComponent } from './components/ai-advisor-modal';
import { CommentsModalComponent } from './components/comments-modal';
import { AttachmentsModalComponent } from './components/attachments-modal';
import { ProjectModalComponent } from './components/project-modal';
import { AuthModalComponent } from './components/auth-modal';
import { PrintReportComponent } from './components/print-report';
import { MapsView } from './components/maps-view';
import { WorkspaceModal } from './components/workspace-modal';
import { GoogleSheetImportModalComponent } from './components/google-sheet-import-modal';
import { I18nService } from './services/i18n.service';
import { StorageService } from './services/storage.service';
import { AuthService } from './services/auth.service';
import { ChecklistItem, generateCsvExport } from './core/checklist-rules';

type ActiveTab = 'checklist' | 'calendar' | 'analytics' | 'chat' | 'maps';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    CommonModule,
    MatIconModule,
    NavbarComponent,
    DashboardStatsComponent,
    ChecklistViewComponent,
    CalendarViewComponent,
    AnalyticsViewComponent,
    TeamChatComponent,
    MapsView,
    WorkspaceModal,
    ItemModalComponent,
    AiAdvisorModalComponent,
    CommentsModalComponent,
    AttachmentsModalComponent,
    ProjectModalComponent,
    AuthModalComponent,
    PrintReportComponent,
    GoogleSheetImportModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  i18n = inject(I18nService);
  storage = inject(StorageService);
  auth = inject(AuthService);

  activeTab = signal<ActiveTab>('checklist');

  // Modals state
  showItemModal = signal<boolean>(false);
  editingItem = signal<ChecklistItem | null>(null);

  showAiAdvisorModal = signal<boolean>(false);
  consultingItem = signal<ChecklistItem | null>(null);

  showCommentsModal = signal<boolean>(false);
  activeCommentsItem = signal<ChecklistItem | null>(null);

  showAttachmentsModal = signal<boolean>(false);
  activeAttachmentsItem = signal<ChecklistItem | null>(null);

  showProjectModal = signal<boolean>(false);
  showAuthModal = signal<boolean>(false);
  showPrintReport = signal<boolean>(false);
  showWorkspaceModal = signal<boolean>(false);
  showGoogleSheetImportModal = signal<boolean>(false);

  openWorkspace() {
    this.showWorkspaceModal.set(true);
  }

  openGoogleSheetImport() {
    this.showGoogleSheetImportModal.set(true);
  }

  onMapItemUpdated(item: ChecklistItem) {
    this.storage.updateItem(item);
  }

  setTab(tab: ActiveTab) {
    this.activeTab.set(tab);
  }

  openAddItem() {
    this.editingItem.set(null);
    this.showItemModal.set(true);
  }

  openEditItem(item: ChecklistItem) {
    this.editingItem.set(item);
    this.showItemModal.set(true);
  }

  openConsultAi(item: ChecklistItem | null) {
    this.consultingItem.set(item);
    this.showAiAdvisorModal.set(true);
  }

  openComments(item: ChecklistItem) {
    this.activeCommentsItem.set(item);
    this.showCommentsModal.set(true);
  }

  openAttachments(item: ChecklistItem) {
    this.activeAttachmentsItem.set(item);
    this.showAttachmentsModal.set(true);
  }

  openNewProject() {
    this.showProjectModal.set(true);
  }

  openAuth() {
    this.showAuthModal.set(true);
  }

  closeAuth() {
    if (this.auth.isAuthenticated()) {
      this.showAuthModal.set(false);
      this.auth.showAuthModal.set(false);
    }
  }

  exportPdf() {
    this.showPrintReport.set(true);
  }

  exportCsv() {
    const items = this.storage.currentProjectItems();
    const csvContent = generateCsvExport(items, this.i18n.currentLang());
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkmate-appliances-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
