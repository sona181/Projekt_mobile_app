import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ExecuteResult {
  status: string;
  statusId: number;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  time: string | null;
}

@Injectable()
export class ExecuteService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private config: ConfigService) {
    this.apiUrl = this.config.get<string>('JUDGE0_API_URL')!;
    this.apiKey = this.config.get<string>('JUDGE0_API_KEY')!;
  }

  async run(code: string, languageId: number, stdin?: string): Promise<ExecuteResult> {
    const headers = {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    };

    const { data: submission } = await axios.post(
      `${this.apiUrl}/submissions?base64_encoded=false&wait=false`,
      { source_code: code, language_id: languageId, stdin: stdin ?? '' },
      { headers },
    );

    const token: string = submission.token;

    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const { data } = await axios.get(
        `${this.apiUrl}/submissions/${token}?base64_encoded=false&fields=status,stdout,stderr,compile_output,time`,
        { headers },
      );
      if (data.status?.id > 2) {
        return {
          status: data.status?.description ?? 'Unknown',
          statusId: data.status?.id ?? 0,
          stdout: data.stdout ?? null,
          stderr: data.stderr ?? null,
          compileOutput: data.compile_output ?? null,
          time: data.time ?? null,
        };
      }
    }

    throw new InternalServerErrorException('Code execution timed out');
  }
}
