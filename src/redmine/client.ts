/**
 * Redmine API クライアント
 *
 * MCPクライアントから送信されるHTTPヘッダーで設定:
 * - x-redmine-url: RedmineのベースURL (例: https://redmine.example.com)
 * - x-redmine-api-key: APIキー
 */

// =====================================
// 型定義
// =====================================

/** Redmineプロジェクト */
export interface RedmineProject {
  id: number
  name: string
  identifier: string
  description: string
  status: number
  is_public: boolean
  created_on: string
  updated_on: string
  parent?: { id: number; name: string }
}

/** Redmineチケット */
export interface RedmineIssue {
  id: number
  project: { id: number; name: string }
  tracker: { id: number; name: string }
  status: { id: number; name: string }
  priority: { id: number; name: string }
  author: { id: number; name: string }
  assigned_to?: { id: number; name: string }
  subject: string
  description: string
  start_date?: string
  due_date?: string
  done_ratio: number
  estimated_hours?: number
  created_on: string
  updated_on: string
  custom_fields?: Array<{
    id: number
    name: string
    value: string | string[]
  }>
}

/** ページネーション情報 */
export interface PaginationInfo {
  offset: number
  limit: number
  total_count: number
}

/** プロジェクト一覧レスポンス */
export interface ProjectsResponse extends PaginationInfo {
  projects: RedmineProject[]
}

/** チケット一覧レスポンス */
export interface IssuesResponse extends PaginationInfo {
  issues: RedmineIssue[]
}

/** チケット作成パラメータ */
export interface CreateIssueParams {
  project_id: string
  subject: string
  description?: string
  tracker_id?: number
  status_id?: number
  priority_id?: number
  category_id?: number
  assigned_to_id?: number
  parent_issue_id?: number
  estimated_hours?: number
  start_date?: string
  due_date?: string
}

/** チケット更新パラメータ */
export interface UpdateIssueParams {
  subject?: string
  description?: string
  tracker_id?: number
  status_id?: number
  priority_id?: number
  category_id?: number
  assigned_to_id?: number
  parent_issue_id?: number
  estimated_hours?: number
  start_date?: string
  due_date?: string
  done_ratio?: number
  notes?: string
  private_notes?: boolean
}

// =====================================
// クライアント実装
// =====================================

export class RedmineClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    if (!baseUrl) {
      throw new Error(
        'Redmine URL is not configured. Set x-redmine-url header.'
      )
    }
    if (!apiKey) {
      throw new Error(
        'Redmine API Key is not configured. Set x-redmine-api-key header.'
      )
    }

    // 末尾のスラッシュを除去
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  /**
   * Redmine APIへのHTTPリクエストを実行
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const headers: Record<string, string> = {
      'X-Redmine-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Redmine API error: ${response.status} - ${errorText}`)
    }

    // 204 No Content または空レスポンスの場合
    if (
      response.status === 204 ||
      response.headers.get('content-length') === '0'
    ) {
      return {} as T
    }

    return response.json() as Promise<T>
  }

  // =====================================
  // Projects API
  // =====================================

  /**
   * プロジェクト一覧を取得
   */
  async listProjects(params?: {
    offset?: number
    limit?: number
    include?: string
  }): Promise<ProjectsResponse> {
    const query = new URLSearchParams()
    if (params?.offset !== undefined) query.set('offset', String(params.offset))
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.include) query.set('include', params.include)

    const queryString = query.toString()
    const path = `/projects.json${queryString ? `?${queryString}` : ''}`

    return this.request('GET', path)
  }

  /**
   * プロジェクト詳細を取得
   */
  async getProject(
    id: string,
    include?: string
  ): Promise<{ project: RedmineProject }> {
    const query = new URLSearchParams()
    if (include) query.set('include', include)

    const queryString = query.toString()
    const path = `/projects/${id}.json${queryString ? `?${queryString}` : ''}`

    return this.request('GET', path)
  }

  // =====================================
  // Issues API
  // =====================================

  /**
   * チケット一覧を取得
   */
  async listIssues(params?: {
    offset?: number
    limit?: number
    sort?: string
    include?: string
    project_id?: string
    tracker_id?: string
    status_id?: string
    assigned_to_id?: string
  }): Promise<IssuesResponse> {
    const query = new URLSearchParams()
    if (params?.offset !== undefined) query.set('offset', String(params.offset))
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.sort) query.set('sort', params.sort)
    if (params?.include) query.set('include', params.include)
    if (params?.project_id !== undefined)
      query.set('project_id', String(params.project_id))
    if (params?.tracker_id !== undefined)
      query.set('tracker_id', String(params.tracker_id))
    if (params?.status_id !== undefined)
      query.set('status_id', String(params.status_id))
    if (params?.assigned_to_id !== undefined)
      query.set('assigned_to_id', String(params.assigned_to_id))

    const queryString = query.toString()
    const path = `/issues.json${queryString ? `?${queryString}` : ''}`

    return this.request('GET', path)
  }

  /**
   * チケット詳細を取得
   */
  async getIssue(
    id: number,
    include?: string
  ): Promise<{ issue: RedmineIssue }> {
    const query = new URLSearchParams()
    if (include) query.set('include', include)

    const queryString = query.toString()
    const path = `/issues/${id}.json${queryString ? `?${queryString}` : ''}`

    return this.request('GET', path)
  }

  /**
   * チケットを作成
   */
  async createIssue(
    params: CreateIssueParams
  ): Promise<{ issue: RedmineIssue }> {
    return this.request('POST', '/issues.json', { issue: params })
  }

  /**
   * チケットを更新
   */
  async updateIssue(
    id: number,
    params: UpdateIssueParams
  ): Promise<{ issue: RedmineIssue }> {
    return this.request('PUT', `/issues/${id}.json`, { issue: params })
  }
}
