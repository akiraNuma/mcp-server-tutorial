/**
 * Redmine MCP ツール定義
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { RedmineClient } from './client.js'

/**
 * ヘッダーから値を取得するヘルパー関数
 * MCP SDK の IsomorphicHeaders は string | string[] | undefined を返すため、
 * 配列の場合は先頭要素を返す
 */
function getHeaderValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  key: string
): string | undefined {
  if (!headers) return undefined
  const value = headers[key]
  if (Array.isArray(value)) return value[0]
  return value
}

/**
 * リクエストヘッダーから Redmine クライアントを生成
 * 必須ヘッダー: x-redmine-url, x-redmine-api-key
 * @throws {Error} ヘッダーが不足している場合
 */
function getClientFromExtra(extra: {
  requestInfo?: { headers?: Record<string, string | string[] | undefined> }
}): RedmineClient {
  const headers = extra.requestInfo?.headers
  if (!headers) {
    throw new Error('Request headers not available')
  }

  const redmineUrl = getHeaderValue(headers, 'x-redmine-url')
  const redmineApiKey = getHeaderValue(headers, 'x-redmine-api-key')

  if (!redmineUrl || !redmineApiKey) {
    throw new Error(
      'Redmine configuration not found. ' +
        'Set x-redmine-url and x-redmine-api-key headers in your request.'
    )
  }

  return new RedmineClient(redmineUrl, redmineApiKey)
}

/**
 * Redmine用のツールをMCPサーバーに登録する
 */
export function registerRedmineTools(server: McpServer): void {
  // =====================================
  // list_projects: プロジェクト一覧取得
  // =====================================
  server.registerTool(
    'list_projects',
    {
      title: 'プロジェクト一覧',
      description:
        'Redmineのプロジェクト一覧を取得します。' +
        'レスポンス: { projects: [...], total_count: 全件数, offset: 開始位置, limit: 取得上限 }',
      inputSchema: {
        offset: z.number().optional().describe('取得開始位置'),
        limit: z
          .number()
          .optional()
          .describe('取得するプロジェクト数（最大100）'),
        include: z
          .string()
          .optional()
          .describe(
            '追加情報（trackers, issue_categories, enabled_modules をカンマ区切り）'
          ),
      },
    },
    async (args, extra) => {
      try {
        const client = getClientFromExtra(extra)
        const result = await client.listProjects({
          offset: args.offset,
          limit: args.limit,
          include: args.include,
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `エラー: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        }
      }
    }
  )

  // =====================================
  // get_project: プロジェクト詳細取得
  // =====================================
  server.registerTool(
    'get_project',
    {
      title: 'プロジェクト詳細',
      description:
        '指定したプロジェクトの詳細情報を取得します。' +
        'レスポンス: { project: { id, name, identifier, description, status, ... } }',
      inputSchema: {
        id: z
          .union([z.number(), z.string()])
          .describe('プロジェクトIDまたは識別子'),
        include: z
          .string()
          .optional()
          .describe(
            '追加情報（trackers, issue_categories, enabled_modules をカンマ区切り）'
          ),
      },
    },
    async (args, extra) => {
      try {
        const client = getClientFromExtra(extra)
        const result = await client.getProject(args.id, args.include)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `エラー: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        }
      }
    }
  )

  // =====================================
  // list_issues: チケット一覧取得
  // =====================================
  server.registerTool(
    'list_issues',
    {
      title: 'チケット一覧',
      description:
        'Redmineのチケット一覧を取得します。デフォルトではオープン状態のチケットのみ返します。' +
        'レスポンス: { issues: [...], total_count: 条件に合う全チケット数, offset: 開始位置, limit: 取得上限 }。',
      inputSchema: {
        project_id: z
          .union([z.number(), z.string()])
          .optional()
          .describe('プロジェクトIDまたは識別子でフィルタ'),
        status_id: z
          .union([z.string(), z.number()])
          .optional()
          .describe(
            'ステータスでフィルタ（open: 未完了, closed: 完了, *: 全て, または数値のステータスID）'
          ),
        assigned_to_id: z
          .union([z.number(), z.string()])
          .optional()
          .describe('担当者IDでフィルタ（"me" で自分自身）'),
        tracker_id: z.number().optional().describe('トラッカーIDでフィルタ'),
        offset: z.number().optional().describe('取得開始位置'),
        limit: z.number().optional().describe('取得するチケット数（最大100）'),
        sort: z
          .string()
          .optional()
          .describe('ソート順（例: "updated_on:desc"）'),
        include: z
          .string()
          .optional()
          .describe('追加情報（attachments, relations をカンマ区切り）'),
      },
    },
    async (args, extra) => {
      try {
        const client = getClientFromExtra(extra)
        const result = await client.listIssues({
          project_id: args.project_id,
          status_id: args.status_id,
          assigned_to_id: args.assigned_to_id,
          tracker_id: args.tracker_id,
          offset: args.offset,
          limit: args.limit,
          sort: args.sort,
          include: args.include,
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `エラー: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        }
      }
    }
  )

  // =====================================
  // get_issue: チケット詳細取得
  // =====================================
  server.registerTool(
    'get_issue',
    {
      title: 'チケット詳細',
      description:
        '指定したチケットの詳細情報を取得します。' +
        'レスポンス: { issue: { id, subject, description, project, tracker, status, priority, author, assigned_to, ... } }',
      inputSchema: {
        id: z.number().describe('チケットID'),
        include: z
          .string()
          .optional()
          .describe(
            '追加情報（children, attachments, relations, changesets, journals, watchers をカンマ区切り）'
          ),
      },
    },
    async (args, extra) => {
      try {
        const client = getClientFromExtra(extra)
        const result = await client.getIssue(args.id, args.include)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `エラー: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        }
      }
    }
  )

  // =====================================
  // create_issue: チケット作成
  // =====================================
  server.registerTool(
    'create_issue',
    {
      title: 'チケット作成',
      description:
        '新しいチケットを作成します。' +
        'レスポンス: { issue: { id, subject, ... } } 作成されたチケットの情報',
      inputSchema: {
        project_id: z
          .union([z.number(), z.string()])
          .describe('プロジェクトIDまたは識別子'),
        subject: z.string().describe('チケットの題名'),
        description: z.string().optional().describe('チケットの説明'),
        tracker_id: z
          .number()
          .optional()
          .describe('トラッカーID（Redmineの設定に依存）'),
        status_id: z
          .number()
          .optional()
          .describe('ステータスID（Redmineの設定に依存）'),
        priority_id: z
          .number()
          .optional()
          .describe('優先度ID（Redmineの設定に依存）'),
        assigned_to_id: z.number().optional().describe('担当者のユーザーID'),
        category_id: z
          .number()
          .optional()
          .describe('カテゴリID（プロジェクトの設定に依存）'),
        parent_issue_id: z
          .number()
          .optional()
          .describe('親チケットのID（子チケットとして作成する場合）'),
        estimated_hours: z.number().optional().describe('予定工数（時間）'),
        start_date: z.string().optional().describe('開始日（YYYY-MM-DD形式）'),
        due_date: z.string().optional().describe('期日（YYYY-MM-DD形式）'),
      },
    },
    async (args, extra) => {
      try {
        const client = getClientFromExtra(extra)
        const result = await client.createIssue({
          project_id: args.project_id,
          subject: args.subject,
          description: args.description,
          tracker_id: args.tracker_id,
          status_id: args.status_id,
          priority_id: args.priority_id,
          assigned_to_id: args.assigned_to_id,
          category_id: args.category_id,
          parent_issue_id: args.parent_issue_id,
          estimated_hours: args.estimated_hours,
          start_date: args.start_date,
          due_date: args.due_date,
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `エラー: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        }
      }
    }
  )

  // =====================================
  // update_issue: チケット更新
  // =====================================
  server.registerTool(
    'update_issue',
    {
      title: 'チケット更新',
      description:
        '既存のチケットを更新します。' +
        'レスポンス: { issue: { id, subject, ... } } 更新後のチケット情報',
      inputSchema: {
        id: z.number().describe('更新するチケットID'),
        subject: z.string().optional().describe('チケットの題名'),
        description: z.string().optional().describe('チケットの説明'),
        tracker_id: z
          .number()
          .optional()
          .describe('トラッカーID（Redmineの設定に依存）'),
        status_id: z
          .number()
          .optional()
          .describe('ステータスID（Redmineの設定に依存）'),
        priority_id: z
          .number()
          .optional()
          .describe('優先度ID（Redmineの設定に依存）'),
        assigned_to_id: z.number().optional().describe('担当者のユーザーID'),
        category_id: z
          .number()
          .optional()
          .describe('カテゴリID（プロジェクトの設定に依存）'),
        parent_issue_id: z.number().optional().describe('親チケットのID'),
        estimated_hours: z.number().optional().describe('予定工数（時間）'),
        start_date: z.string().optional().describe('開始日（YYYY-MM-DD形式）'),
        due_date: z.string().optional().describe('期日（YYYY-MM-DD形式）'),
        done_ratio: z.number().optional().describe('進捗率（0-100の整数）'),
        notes: z
          .string()
          .optional()
          .describe('コメント（更新時に追加するメモ）'),
        private_notes: z
          .boolean()
          .optional()
          .describe('コメントをプライベートにするか（true/false）'),
      },
    },
    async (args, extra) => {
      try {
        const client = getClientFromExtra(extra)
        const { id, ...updateParams } = args
        const result = await client.updateIssue(id, updateParams)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `エラー: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        }
      }
    }
  )
}
