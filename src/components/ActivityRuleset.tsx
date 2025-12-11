import React from "react";
import type { Item } from "../types/ChapterEditorTypes";
import { parseRuleset, parseTimeLimitParts, convertToTotalSeconds, validatePercentage } from "../utils/chapterEditorUtils";

interface ActivityRulesetProps {
    item: Item;
    timeLimitEnabledMap: Record<string, boolean>;
    onTimeLimitEnabledChange: (serialKey: string, enabled: boolean) => void;
    onRulesetFieldUpdate: (field: string, value: any) => void;
}

export const ActivityRuleset: React.FC<ActivityRulesetProps> = ({
    item,
    timeLimitEnabledMap,
    onTimeLimitEnabledChange,
    onRulesetFieldUpdate,
}) => {
    const ruleset = parseRuleset(item.ruleset);
    const serialKey = item.uiSerialId ?? String(item.id);
    const timeLimitEnabled = timeLimitEnabledMap[serialKey] ?? (ruleset.timeLimit != null);

    const { hours, minutes, seconds } = parseTimeLimitParts(ruleset.timeLimit);

    const setFromParts = (h: number, m: number, s: number) => {
        const totalSec = convertToTotalSeconds(h, m, s);
        onRulesetFieldUpdate('timeLimit', totalSec);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        const existingTime = (() => {
            if (!ruleset.closeDateTime) return '00:00';
            const d = new Date(ruleset.closeDateTime);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        })();

        if (date) {
            const [y, mo, da] = date.split('-').map((v: string) => Number(v));
            const [hh, mm] = existingTime.split(':').map((v: string) => Number(v));
            const dt = new Date(y, mo - 1, da, hh, mm);
            onRulesetFieldUpdate('closeDateTime', dt.toISOString());
        } else {
            onRulesetFieldUpdate('closeDateTime', undefined);
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value;
        const existingDate = (() => {
            if (!ruleset.closeDateTime) {
                const nd = new Date();
                return `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`;
            }
            const d = new Date(ruleset.closeDateTime);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })();

        if (time) {
            const [y, mo, da] = existingDate.split('-').map((v: string) => Number(v));
            const [hh, mm] = time.split(':').map((v: string) => Number(v));
            const dt = new Date(y, mo - 1, da, hh, mm);
            onRulesetFieldUpdate('closeDateTime', dt.toISOString());
        } else {
            onRulesetFieldUpdate('closeDateTime', undefined);
        }
    };

    const handlePointsDeductionChange = (raw: string) => {
        let v: any = raw === '' ? undefined : Number(raw);
        const strategy = ruleset.deductionStrategy ?? 'FLAT';
        if (strategy === 'PERCENTAGE' && v != null) {
            if (Number.isNaN(v)) v = undefined;
            else v = validatePercentage(v);
        }
        onRulesetFieldUpdate('pointsDeduction', v);
    };

    const isDeductScore = ruleset.timeExceededPenalty === 'DEDUCT_SCORE';
    const strategy = ruleset.deductionStrategy ?? 'FLAT';
    const pointsDeductionDisabled = !timeLimitEnabled || !isDeductScore;

    return (
        <div className="bg-slate-900/40 border border-white/10 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Ruleset</h3>

            {/* Checkboxes Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4">
                    {/* Enabled Checkbox */}
                    <div className="flex items-center gap-3 group/checkbox">
                        <label htmlFor={`enabled-${item.id}`} className="relative flex items-center cursor-pointer">
                            <input
                                id={`enabled-${item.id}`}
                                type="checkbox"
                                checked={!!ruleset.enabled}
                                onChange={(e) => onRulesetFieldUpdate('enabled', e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center group-hover/checkbox:border-indigo-500 peer-focus:ring-2 peer-focus:ring-indigo-500/30 peer-focus:ring-offset-2 peer-focus:ring-offset-slate-900 ${
                                !!ruleset.enabled 
                                    ? 'bg-indigo-600 border-indigo-600' 
                                    : 'bg-slate-800/50 border-slate-600'
                            }`}>
                                {!!ruleset.enabled && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="ml-3 text-sm font-medium text-slate-400 group-hover/checkbox:text-slate-300 transition-colors select-none">Enabled</span>
                        </label>
                    </div>

                    {/* Time Limit Enabled Checkbox */}
                    <div className="flex items-center gap-3 group/checkbox">
                        <label htmlFor={`timelimit-enabled-${serialKey}`} className="relative flex items-center cursor-pointer">
                            <input
                                id={`timelimit-enabled-${serialKey}`}
                                type="checkbox"
                                checked={timeLimitEnabled}
                                onChange={(e) => onTimeLimitEnabledChange(serialKey, e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center group-hover/checkbox:border-indigo-500 peer-focus:ring-2 peer-focus:ring-indigo-500/30 peer-focus:ring-offset-2 peer-focus:ring-offset-slate-900 ${
                                timeLimitEnabled 
                                    ? 'bg-indigo-600 border-indigo-600' 
                                    : 'bg-slate-800/50 border-slate-600'
                            }`}>
                                {timeLimitEnabled && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="ml-3 text-sm font-medium text-slate-400 group-hover/checkbox:text-slate-300 transition-colors select-none">Enable time limit</span>
                        </label>
                    </div>
                </div>

                {/* Time Limit Inputs */}
                <div>
                    <label className="text-sm font-medium text-slate-400 mb-2 block">Time Limit</label>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs text-slate-400">Hours</label>
                            <input
                                type="number"
                                min={0}
                                value={hours}
                                onChange={(e) => setFromParts(e.target.value ? Number(e.target.value) : 0, minutes, seconds)}
                                disabled={!timeLimitEnabled}
                                className={`w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500/40 focus:outline-none transition-all ${!timeLimitEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Minutes</label>
                            <input
                                type="number"
                                min={0}
                                max={59}
                                value={minutes}
                                onChange={(e) => setFromParts(hours, e.target.value ? Number(e.target.value) : 0, seconds)}
                                disabled={!timeLimitEnabled}
                                className={`w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500/40 focus:outline-none transition-all ${!timeLimitEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Seconds</label>
                            <input
                                type="number"
                                min={0}
                                max={59}
                                value={seconds}
                                onChange={(e) => setFromParts(hours, minutes, e.target.value ? Number(e.target.value) : 0)}
                                disabled={!timeLimitEnabled}
                                className={`w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500/40 focus:outline-none transition-all ${!timeLimitEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Close Date/Time Section */}
            <div>
                <label className="text-sm font-medium text-slate-400 mb-2 block">Close Date</label>
                <input
                    type="date"
                    value={(() => {
                        if (!ruleset.closeDateTime) return '';
                        const d = new Date(ruleset.closeDateTime);
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        return `${y}-${m}-${dd}`;
                    })()}
                    onChange={handleDateChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition hover:bg-blue-500/10 hover:border-blue-500/30"
                />

                <label className="text-sm font-medium text-slate-400 mb-2 block mt-3">Close Time</label>
                <input
                    type="time"
                    value={(() => {
                        if (!ruleset.closeDateTime) return '';
                        const d = new Date(ruleset.closeDateTime);
                        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    })()}
                    onChange={handleTimeChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition hover:bg-blue-500/10 hover:border-blue-500/30"
                />

                <div className="mt-4">
                    <label className="text-sm font-medium text-slate-400 mb-2 block">Time Exceeded Penalty</label>
                    <div className="relative">
                        <select
                            value={ruleset.timeExceededPenalty ?? 'NO_TIME_LIMIT'}
                            onChange={(e) => onRulesetFieldUpdate('timeExceededPenalty', e.target.value)}
                            disabled={!timeLimitEnabled}
                            className={`w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition hover:bg-blue-500/10 hover:border-blue-500/30 cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white [&>option:checked]:bg-blue-600 ${!timeLimitEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            <option value="NO_TIME_LIMIT">No time limit</option>
                            <option value="CLOSE_ACTIVITY">Close activity</option>
                            <option value="DEDUCT_SCORE">Deduct score</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                                className="h-4 w-4 text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Deduction Strategy & Points Deduction */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-400 mb-2 block">Deduction Strategy</label>
                        <div className="relative">
                            <select
                                value={strategy}
                                onChange={(e) => onRulesetFieldUpdate('deductionStrategy', e.target.value)}
                                disabled={!timeLimitEnabled}
                                className={`w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition hover:bg-blue-500/10 hover:border-blue-500/30 cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white [&>option:checked]:bg-blue-600 ${!timeLimitEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                                <option value="FLAT">Flat</option>
                                <option value="PERCENTAGE">Percentage</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg
                                    className="h-4 w-4 text-blue-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-400 mb-2 block">Points Deduction</label>
                        <input
                            type="number"
                            step={strategy === 'FLAT' ? 'any' : '0.1'}
                            min={strategy === 'PERCENTAGE' ? 0 : undefined}
                            max={strategy === 'PERCENTAGE' ? 100 : undefined}
                            value={ruleset.pointsDeduction ?? ''}
                            onChange={(e) => handlePointsDeductionChange(e.target.value)}
                            disabled={pointsDeductionDisabled}
                            className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition hover:bg-blue-500/10 hover:border-blue-500/30 ${pointsDeductionDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};