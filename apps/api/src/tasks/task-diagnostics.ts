export function suggestTaskFix(task: any) {
  const msg = `${task.errorCode ?? ''} ${task.errorMessage ?? ''}`.toLowerCase();
  if (msg.includes('auth') || msg.includes('401')) return '检查 provider API key、baseUrl 和 WORKBENCH_ADMIN_TOKEN。';
  if (msg.includes('timeout')) return '降低 quality/size/count 或提高 timeoutSec 后重试。';
  if (msg.includes('transparent')) return '该模型不支持 transparent background，切换 gpt-image-1.5 或改为 auto。';
  if (msg.includes('rate') || msg.includes('429')) return 'Provider 限流，等待后重试或切换 provider。';
  return '查看 route/diagnostics，优先确认模型能力、API mode、size/quality/format 是否匹配。';
}
