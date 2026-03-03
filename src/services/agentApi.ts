/**
 * Agent API Service
 */
import { api } from './api';
import type { Agent, AgentStatus } from '../types';

export const agentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInactiveAgent: builder.query<Agent, void>({
      query: () => '/asterisk/getInactiveAgent',
      providesTags: ['Agent'],
    }),
    getAllAgents: builder.query<Agent[], void>({
      query: () => '/asterisk/all',
      providesTags: ['Agent'],
    }),
    updateAgentStatus: builder.mutation<Agent, { id: string; status: AgentStatus; username: string }>({
      query: ({ id, status, username }) => ({
        url: `/asterisk/agent/status/${id}`,
        method: 'PATCH',
        body: { status, username },
      }),
      // Don't invalidate - status updates shouldn't trigger agent refetch
      // which would cause credentials to change and SIP to re-register
    }),
  }),
});

export const {
  useGetInactiveAgentQuery,
  useLazyGetInactiveAgentQuery,
  useGetAllAgentsQuery,
  useUpdateAgentStatusMutation,
} = agentApi;
