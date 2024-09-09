import _ from 'lodash';
import { ConfigCommand } from './ConfigCommand';
import { EvalCommandOutput, EvaluatedConfig } from './EvalCommand';
import { String } from '../utils/String';

export type ExportCommandOutput = {
  [key: string]: string;
};

export type ExportCommandInput = {
  pipe: EvalCommandOutput;
  filter?: (config: EvaluatedConfig) => boolean;
  keys?: (config: EvaluatedConfig) => string;
};

export class ExportCommand extends ConfigCommand<ExportCommandInput, ExportCommandOutput> {
  async execute() {
    const exportedPipe = this.mutateKeys(this.filterPipe());
    const result: ExportCommandOutput = _.mapValues(exportedPipe, (current) => current.value);
    return result;
  }

  private filterPipe() {
    const { pipe, filter } = this.input;

    // apply default filter - hide hidden configs
    if (!filter) {
      return _.pickBy(pipe, ({ context }) => !context.cfgu.hidden);
    }
    return _.pickBy(pipe, filter);
  }

  private mutateKeys(result: EvalCommandOutput): EvalCommandOutput {
    const { keys } = this.input;

    if (!keys) {
      return result;
    }

    return _.mapKeys(result, (current) => {
      const mutatedKey = keys(current);
      if (!String.validateNaming(mutatedKey)) {
        throw new Error(`ConfigKey "${mutatedKey}" ${String.namingErrorMessage}`);
      }
      // original key at current.context.key
      return mutatedKey;
    });
  }
}
