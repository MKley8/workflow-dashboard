import type { Timestamp } from 'firebase/firestore'

/**
 * A to-do task. Anyone can create one for themselves; only admins can
 * assign a task to one or more other people (see Firestore rules). Tasks
 * can optionally link to one or more catalog apps, so hovering a
 * dashboard tile can show which active tasks relate to it.
 */
export interface TodoItem {
  id: string
  title: string
  description?: string
  /** The accounts this task is for - one entry unless an admin assigned it to several. */
  assignedToUids: string[]
  assignedToEmails?: (string | null)[]
  /** The account that created it (an admin, if assigned to someone else). */
  createdByUid: string
  createdByEmail?: string | null
  /** Catalog app ids this task relates to, e.g. "renew licence for Shiftly". */
  linkedAppIds: string[]
  done: boolean
  createdAt?: Timestamp | null
  doneAt?: Timestamp | null
}

export type TodoItemInput = Omit<TodoItem, 'id' | 'createdAt' | 'doneAt' | 'done'>
