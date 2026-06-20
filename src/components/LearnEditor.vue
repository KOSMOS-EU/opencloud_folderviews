<template>
  <div class="learn-editor">
    <div class="learn-editor-header">
      <button class="learn-back-btn" @click="$emit('close')">
        <oc-icon name="arrow-left-s" size="small" />
        <span>Zurück</span>
      </button>
      <span v-if="fileReference" class="learn-fileref">{{ fileReference }}</span>
      <h2 class="learn-title">{{ title || folder?.name || '' }}</h2>
      <div class="learn-header-actions">
        <button v-if="!editing" class="learn-edit-btn" @click="editing = true">
          <oc-icon name="edit-2" size="small" />
          <span>Bearbeiten</span>
        </button>
        <button v-if="editing" class="learn-save-btn" @click="save">
          <oc-icon name="check" size="small" />
          <span>Speichern</span>
        </button>
        <button v-if="editing" class="learn-cancel-btn" @click="cancelEdit">
          <oc-icon name="close" size="small" />
          <span>Abbrechen</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="learn-loading">Laden...</div>

    <div v-else class="learn-body">
      <!-- Description -->
      <div class="learn-description">
        <div v-if="!editing" class="learn-md-rendered" v-html="renderedDescription"></div>
        <textarea
          v-else
          v-model="editDescription"
          class="learn-md-editor"
          placeholder="Beschreibung (Markdown)..."
          rows="8"
        ></textarea>
      </div>

      <!-- Tasks -->
      <div class="learn-tasks-section">
        <h3>Aufgaben</h3>
        <div class="learn-tasks-grid">
          <div
            v-for="task in tasks"
            :key="task.file"
            class="learn-task-card"
            :style="{ backgroundColor: task.color || '#666' }"
            @click="selectedTask = task"
          >
            <oc-icon :name="taskIconName(task.icon)" size="large" class="learn-task-icon" />
            <span class="learn-task-title">{{ task.title }}</span>
            <span class="learn-task-type">{{ taskTypeLabel(task.type) }}</span>
          </div>
          <div v-if="editing" class="learn-task-card learn-task-add" @click="addTask">
            <oc-icon name="add" size="large" />
            <span>Neue Aufgabe</span>
          </div>
        </div>
      </div>

      <!-- Task Detail Dialog -->
      <div v-if="selectedTask" class="learn-task-detail-overlay" @click.self="selectedTask = null">
        <div class="learn-task-detail">
          <div class="learn-task-detail-header" :style="{ backgroundColor: selectedTask.color || '#666' }">
            <oc-icon :name="taskIconName(selectedTask.icon)" size="xlarge" />
            <h3>{{ selectedTask.title }}</h3>
            <button class="learn-close-btn" @click="selectedTask = null">
              <oc-icon name="close" size="small" />
            </button>
          </div>
          <div class="learn-task-detail-body">
            <div v-if="!editing" class="learn-task-desc" v-html="renderMd(selectedTask.description || '')"></div>
            <template v-else>
              <label>Titel</label>
              <input v-model="selectedTask.title" class="learn-input" />
              <label>Typ</label>
              <div class="learn-type-grid">
                <button
                  v-for="tt in taskTypes"
                  :key="tt.type"
                  class="learn-type-btn"
                  :class="{ active: selectedTask.type === tt.type }"
                  :style="{ borderColor: selectedTask.type === tt.type ? tt.color : 'transparent' }"
                  @click="selectedTask.type = tt.type; selectedTask.icon = tt.icon; selectedTask.color = tt.color"
                >
                  <oc-icon :name="taskIconName(tt.icon)" size="small" />
                  <span>{{ tt.label }}</span>
                </button>
              </div>
              <label>Beschreibung (Markdown)</label>
              <textarea v-model="selectedTask.description" rows="4" class="learn-input"></textarea>
              <label>Sozialform</label>
              <select v-model="selectedTask.socialForm" class="learn-input">
                <option>Einzelarbeit</option>
                <option>Partnerarbeit</option>
                <option>Gruppenarbeit</option>
              </select>
              <label>Zeitaufwand</label>
              <select v-model="selectedTask.effort" class="learn-input">
                <option>5 Minuten</option>
                <option>10 Minuten</option>
                <option>15 Minuten</option>
                <option>20 Minuten</option>
                <option>30 Minuten</option>
                <option>45 Minuten</option>
                <option>60 Minuten</option>
              </select>
              <label>Abgabeform</label>
              <select v-model="selectedTask.submissionForm" class="learn-input">
                <option>keine</option>
                <option>digital</option>
                <option>Heft</option>
                <option>mündlich</option>
              </select>
              <label>Korrekturform</label>
              <select v-model="selectedTask.correctionForm" class="learn-input">
                <option>Selbstkorrektur</option>
                <option>Lehrerkorrektur</option>
                <option>Partnerkorrektur</option>
              </select>
              <label>Lösung</label>
              <textarea v-model="selectedTask.solution" rows="3" class="learn-input"></textarea>
            </template>
            <div class="learn-task-meta">
              <span v-if="selectedTask.socialForm">📋 {{ selectedTask.socialForm }}</span>
              <span v-if="selectedTask.effort">⏱ {{ selectedTask.effort }}</span>
              <span v-if="selectedTask.correctionForm">✅ {{ selectedTask.correctionForm }}</span>
            </div>
            <div v-if="selectedTask.attachments?.length" class="learn-task-attachments">
              <h4>Anhänge</h4>
              <div v-for="att in selectedTask.attachments" :key="att.name" class="learn-attachment">
                <oc-icon name="attachment" size="small" />
                <span>{{ att.name }}</span>
              </div>
            </div>
            <div v-if="editing" class="learn-task-detail-actions">
              <button class="learn-delete-btn" @click="deleteTask(selectedTask)">
                <oc-icon name="delete-bin" size="small" />
                Löschen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import { useClientService } from '@opencloud-eu/web-pkg'
import { marked } from 'marked'

interface TaskData {
  file: string
  version: number
  type: string
  title: string
  description: string
  icon: string
  color: string
  badgeIcon?: string | null
  level?: string | null
  attachments: { name: string; path: string }[]
  socialForm: string
  submissionForm: string
  effort: string
  correctionForm: string
  solution: string
}

const props = defineProps<{
  space: SpaceResource
  folder: Resource
}>()

const emit = defineEmits(['close'])

const clientService = useClientService()

const loading = ref(true)
const editing = ref(false)
const title = ref('')
const description = ref('')
const editDescription = ref('')
const tasks = ref<TaskData[]>([])
const selectedTask = ref<TaskData | null>(null)
const fileReference = ref('')

const taskTypes = [
  { type: 'book', icon: 'book-open', color: '#1565C0', label: 'Buch' },
  { type: 'workbook', icon: 'book-2', color: '#1565C0', label: 'Arbeitsheft' },
  { type: 'worksheet', icon: 'file-text', color: '#4527A0', label: 'Arbeitsblatt' },
  { type: 'digital', icon: 'computer', color: '#4527A0', label: 'Digital' },
  { type: 'weblink', icon: 'global', color: '#00838F', label: 'Weblink' },
  { type: 'collection', icon: 'layout-grid', color: '#00838F', label: 'Sammlung' },
  { type: 'learningapp', icon: 'cpu', color: '#2E7D32', label: 'LearningApp' },
  { type: 'selftest', icon: 'checkbox', color: '#2E7D32', label: 'Selbsttest' },
  { type: 'survey', icon: 'question', color: '#2E7D32', label: 'Umfrage' },
  { type: 'creative', icon: 'edit', color: '#C62828', label: 'Kreativ' },
  { type: 'video', icon: 'play-circle', color: '#1565C0', label: 'Video' }
]

// Icon mapping: .task icon names to remixicon names used by oc-icon
function taskIconName(icon: string): string {
  const map: Record<string, string> = {
    'book-open': 'book-open',
    'book': 'book-2',
    'file-text': 'file-text',
    'monitor': 'computer',
    'globe': 'global',
    'grid': 'layout-grid',
    'cpu': 'cpu',
    'check-square': 'checkbox',
    'help-circle': 'question',
    'edit-3': 'edit',
    'play-circle': 'play-circle'
  }
  return map[icon] || icon
}

function taskTypeLabel(type: string): string {
  return taskTypes.find(t => t.type === type)?.label || type
}

function renderMd(md: string): string {
  return marked.parse(md, { async: false }) as string
}

const renderedDescription = computed(() => renderMd(description.value))

async function loadContent() {
  loading.value = true
  const sp = props.space
  const folder = props.folder
  if (!sp || !folder) return

  try {
    // Load metadata for fileReference
    const httpClient = (clientService as any).httpAuthenticated
    if (httpClient) {
      try {
        const spaceId = sp.id
        const itemId = `${spaceId}!${folder.id.split('!').pop()}`
        const { data } = await httpClient.get(`/graph/v1beta1/drives/${spaceId}/items/${itemId}/metadata`)
        fileReference.value = data?.['oy.fileReference'] || ''
      } catch { /* ignore */ }
    }

    // Load seite.md
    try {
      const { body } = await clientService.webdav.getFileContents(sp, {
        path: folder.path + '/seite.md'
      }) as any
      const text = typeof body === 'string' ? body : new TextDecoder().decode(body)
      // Parse YAML frontmatter
      const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (fmMatch) {
        const fm = fmMatch[1]
        const titleMatch = fm.match(/^title:\s*(.+)$/m)
        if (titleMatch) title.value = titleMatch[1].trim()
        description.value = fmMatch[2].trim()
      } else {
        description.value = text
      }
    } catch {
      // No seite.md
    }

    // Load .task files
    const { children } = await clientService.webdav.listFiles(sp, { path: folder.path })
    const taskFiles = children.filter(r => r.name?.endsWith('.task')).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
    )
    const loadedTasks: TaskData[] = []
    for (const tf of taskFiles) {
      try {
        const { body } = await clientService.webdav.getFileContents(sp, {
          path: tf.path
        }) as any
        const text = typeof body === 'string' ? body : new TextDecoder().decode(body)
        const data = JSON.parse(text)
        loadedTasks.push({ ...data, file: tf.name })
      } catch { /* skip broken tasks */ }
    }
    tasks.value = loadedTasks
  } catch (e) {
    console.error('[LearnEditor] load failed:', e)
  } finally {
    loading.value = false
  }
}

function cancelEdit() {
  editing.value = false
  editDescription.value = ''
  loadContent() // reload to discard changes
}

async function save() {
  const sp = props.space
  const folder = props.folder
  if (!sp || !folder) return

  try {
    // Save seite.md
    const md = `---\ntitle: ${title.value}\n---\n\n${editDescription.value || description.value}`
    await clientService.webdav.putFileContents(sp, {
      path: folder.path + '/seite.md',
      content: md
    })

    // Save each task
    for (let i = 0; i < tasks.value.length; i++) {
      const task = tasks.value[i]
      const seq = String(i + 1).padStart(2, '0')
      const safeName = task.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '_').substring(0, 30)
      const fileName = `${seq}_${safeName}.task`
      const taskData = { ...task }
      delete (taskData as any).file
      await clientService.webdav.putFileContents(sp, {
        path: folder.path + '/' + fileName,
        content: JSON.stringify(taskData, null, 2)
      })
      // Delete old file if renamed
      if (task.file && task.file !== fileName) {
        try {
          await clientService.webdav.deleteFile(sp, { path: folder.path + '/' + task.file })
        } catch { /* ignore */ }
      }
      task.file = fileName
    }

    if (editDescription.value) {
      description.value = editDescription.value
    }
    editing.value = false
  } catch (e) {
    console.error('[LearnEditor] save failed:', e)
    alert('Speichern fehlgeschlagen: ' + (e as Error).message)
  }
}

function addTask() {
  const newTask: TaskData = {
    file: '',
    version: 1,
    type: 'worksheet',
    title: 'Neue Aufgabe',
    description: '',
    icon: 'file-text',
    color: '#4527A0',
    attachments: [],
    socialForm: 'Einzelarbeit',
    submissionForm: 'keine',
    effort: '15 Minuten',
    correctionForm: 'Selbstkorrektur',
    solution: ''
  }
  tasks.value.push(newTask)
  selectedTask.value = newTask
}

function deleteTask(task: TaskData) {
  tasks.value = tasks.value.filter(t => t !== task)
  selectedTask.value = null
  // If task had a file, delete it on save
}

watch(() => props.folder, () => loadContent(), { immediate: true })
watch(() => editing.value, (val) => {
  if (val) editDescription.value = description.value
})
</script>

<style scoped>
.learn-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--oc-role-surface, #fff);
}

.learn-editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #ddd);
  flex-wrap: wrap;
}

.learn-back-btn, .learn-edit-btn, .learn-save-btn, .learn-cancel-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--oc-role-outline-variant, #ccc);
  border-radius: 4px;
  background: none;
  cursor: pointer;
  font-size: 13px;
}

.learn-save-btn { background: #2E7D32; color: #fff; border-color: #2E7D32; }
.learn-delete-btn { background: #C62828; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px; }

.learn-fileref {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--oc-role-outline-variant, #eee);
  border-radius: 3px;
  font-family: monospace;
}

.learn-title {
  flex: 1;
  font-size: 18px;
  margin: 0;
}

.learn-header-actions { display: flex; gap: 8px; }
.learn-loading { padding: 40px; text-align: center; color: #888; }

.learn-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.learn-description { margin-bottom: 24px; }

.learn-md-rendered {
  line-height: 1.6;
}
.learn-md-rendered :deep(h2) { font-size: 16px; margin: 0 0 8px; }
.learn-md-rendered :deep(ul) { padding-left: 20px; }
.learn-md-rendered :deep(li) { margin-bottom: 4px; }

.learn-md-editor {
  width: 100%;
  font-family: monospace;
  font-size: 13px;
  padding: 12px;
  border: 1px solid var(--oc-role-outline-variant, #ccc);
  border-radius: 4px;
  resize: vertical;
}

.learn-tasks-section h3 {
  font-size: 15px;
  margin: 0 0 12px;
}

.learn-tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.learn-task-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  min-height: 120px;
  transition: transform 0.1s;
}
.learn-task-card:hover { transform: scale(1.03); }

.learn-task-add {
  background: var(--oc-role-outline-variant, #ddd) !important;
  color: var(--oc-role-on-surface, #333) !important;
  border: 2px dashed var(--oc-role-outline, #999);
}

.learn-task-icon { opacity: 0.9; }
.learn-task-title { font-size: 12px; font-weight: 600; text-align: center; line-height: 1.3; }
.learn-task-type { font-size: 10px; opacity: 0.8; }

/* Task Detail Dialog */
.learn-task-detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.learn-task-detail {
  background: var(--oc-role-surface, #fff);
  border-radius: 8px;
  width: min(500px, 90vw);
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.learn-task-detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  color: #fff;
  border-radius: 8px 8px 0 0;
  position: relative;
}
.learn-task-detail-header h3 { flex: 1; margin: 0; }
.learn-close-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
}

.learn-task-detail-body {
  padding: 20px;
}
.learn-task-detail-body label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin: 12px 0 4px;
  color: #666;
}
.learn-input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--oc-role-outline-variant, #ccc);
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
}
textarea.learn-input { resize: vertical; font-family: monospace; }

.learn-type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin: 4px 0 8px;
}
.learn-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  border: 2px solid transparent;
  border-radius: 4px;
  background: var(--oc-role-surface-variant, #f5f5f5);
  cursor: pointer;
  font-size: 10px;
}
.learn-type-btn.active { background: #e3f2fd; }

.learn-task-meta {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  font-size: 13px;
  color: #666;
}

.learn-task-attachments { margin-top: 12px; }
.learn-task-attachments h4 { font-size: 13px; margin: 0 0 8px; }
.learn-attachment {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 13px;
}

.learn-task-detail-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
