/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { toast } from 'sonner';
import { MappedData, PredictionRequest } from '../../types/mapping';
import { FancyOddsMapping, Match } from '../types/fancyOdds';
import { mappingService } from './mapping-service';

export class MappingService {
    private currentMatch: Match | null = null;

    constructor() {
        this.currentMatch = null;
    }

    public setCurrentMatch(match: Match) {
        this.currentMatch = match;
    }

    public getCurrentMatch(): Match | null {
        return this.currentMatch;
    }
}

export async function sendPrediction(
    selectionId: string,
    odds: number,
    stake: number,
    type: 'fancy-odds' | 'bookmaker-odds' | 'match-odds',
    level: number,
    isBack: boolean
) {
    const token = localStorage.getItem('token');
    if (!token) {
        toast.error('Please login to place a bet');
        return;
    }

    // Show loading toast
    const loadingToast = toast.loading('Placing your bet...', {
        duration: 3000, // 30 seconds timeout
    });

    try {
        let mapped: MappedData | null = null;

        // Get mapped data based on bet type
        switch (type) {
            case 'fancy-odds': {
                const result = await mappingService.getBySelectionIdAndOptionName(
                    selectionId,
                    isBack ? 'Back' : 'Lay'
                );
                mapped = result ? { ...result[0], type: 'fancy-odds' } as MappedData : null;
                break;
            }
            case 'bookmaker-odds':
            case 'match-odds': {
                const result = await mappingService.getMatchBySelectionId(selectionId);
                mapped = result ? { ...result, type } as MappedData : null;
                break;
            }
            default:
                throw new Error('Invalid bet type');
        }

        if (!mapped) {
            throw new Error(`No ${type} data found for selection ${selectionId}`);
        }

        // Validate required fields and construct request body
        const requiredFields: Array<keyof MappedData> = [
            'runnerName',
            'matchId',
            'questionId',
            'optionId',
            'optionName',
            'marketId',
            'eventId',
            'selectionId',
            'type'
        ];

        if (!mapped || requiredFields.some(field => !mapped![field])) {
            throw new Error(`Invalid ${type} data: Missing required fields`);
        }

        const body: PredictionRequest = {
            market_id: mapped.marketId,
            event_id: mapped.eventId,
            invest_amount: stake,
            RunnerName: mapped.runnerName,
            match_id: mapped.matchId,
            betquestion_id: mapped.questionId,
            betoption_id: mapped.optionId,
            Option_name: mapped.optionName,
            ratio: odds.toString(),
            selection_id: selectionId,
            type,
            is_back: isBack,
            level
        };

        // Send prediction request
        const response = await fetch('https://book2500.funzip.in/api/prediction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        toast.dismiss(loadingToast);

        if (data.success) {
            toast.success('Bet placed successfully!');
            return data;
        } else {
            const errorMessage = data.message || 'Failed to place bet';
            toast.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error: any) {
        toast.dismiss(loadingToast);
        const errorMessage = error.message || 'An error occurred while placing your bet';
        toast.error(errorMessage);
        console.error('Error sending prediction:', error);
        throw error;
    }
}