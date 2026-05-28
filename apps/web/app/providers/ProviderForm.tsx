import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ProviderFormProps = {
  loading: boolean;
  createProvider: (event: FormEvent<HTMLFormElement>) => void;
  seedEnv: () => void;
};

export function ProviderForm({ loading, createProvider, seedEnv }: ProviderFormProps) {
  return <Card>
    <form onSubmit={createProvider}>
      <CardHeader>
        <CardDescription>New Provider</CardDescription>
        <CardTitle>接入 OpenAI-compatible 服务</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label htmlFor="provider-name">Name</Label><Input id="provider-name" name="name" placeholder="gettoken / freemodel / custom" required /></div>
        <div className="space-y-2"><Label>Type</Label><Select name="type" defaultValue="openai-compatible"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="openai-compatible">openai-compatible</SelectItem><SelectItem value="custom-http">custom-http</SelectItem><SelectItem value="fal">fal</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="provider-base-url">Base URL</Label><Input id="provider-base-url" name="baseUrl" placeholder="https://api.example.com/v1" required /></div>
        <div className="space-y-2"><Label htmlFor="provider-api-key">API Key</Label><Input id="provider-api-key" name="apiKey" type="password" placeholder="sk-..." required /></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="provider-default-model">Default Model</Label><Input id="provider-default-model" name="defaultModel" defaultValue="gpt-image-2" /></div>
          <div className="space-y-2"><Label>API Mode</Label><Select name="apiMode" defaultValue="auto"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">auto</SelectItem><SelectItem value="images">images</SelectItem><SelectItem value="responses">responses</SelectItem></SelectContent></Select></div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button disabled={loading} type="submit">保存 Provider</Button>
          <Button variant="secondary" type="button" onClick={seedEnv}>从环境变量同步 gettoken</Button>
        </div>
      </CardContent>
    </form>
  </Card>;
}
