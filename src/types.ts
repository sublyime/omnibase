/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UnitType {
  DIRECTORY = 'DIRECTORY',
  DOCUMENT = 'DOCUMENT',
  MEDIA = 'MEDIA',
  MODEL_3D = 'MODEL_3D',
  CAD = 'CAD',
  SPREADSHEET = 'SPREADSHEET'
}

export interface Comment {
  id: string;
  unit_id: string;
  user_id: string;
  user_name: string;
  content: string;
  timestamp: string;
  parent_id?: string;
}

export interface Annotation {
  id: string;
  unit_id: string;
  user_id: string;
  user_name: string;
  text: string;
  start_index: number;
  end_index: number;
  timestamp: string;
}

export interface Version {
  id: string;
  unit_id: string;
  version_number: number;
  content: string;
  author_id: string;
  author_name: string;
  change_summary: string;
  timestamp: string;
}

export interface KnowledgeUnit {
  id: string;
  name: string;
  type: UnitType;
  parent_id: string | null;
  content?: string;
  metadata?: string;
  tags: string[];
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  version_count: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: string[];
}

export interface SearchResult extends KnowledgeUnit {
  score?: number;
}

export interface SearchFilters {
  dateStart?: string;
  dateEnd?: string;
  fileTypes?: UnitType[];
  authors?: string[];
  tags?: string[];
}
