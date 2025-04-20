import { MappedData } from '../types/prediction';

export class MappingService {
    private mappings: Map<string, MappedData> = new Map();

    getBySelectionIdAndOptionName(selectionId: string, optionName: string): MappedData[] {
        return Array.from(this.mappings.values()).filter(
            m => m.selectionId === selectionId && m.optionName === optionName
        );
    }

    getBookmakerBySelectionId(selectionId: string): MappedData | undefined {
        return Array.from(this.mappings.values()).find(
            m => m.selectionId === selectionId && m.type === 'bookmaker-odds'
        );
    }

    getMatchBySelectionId(selectionId: string): MappedData | undefined {
        return Array.from(this.mappings.values()).find(
            m => m.selectionId === selectionId && m.type === 'match-odds'
        );
    }
}

export const mappingService = new MappingService();