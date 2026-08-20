export interface ef_environment
{
    id:       string;
    label:    string;
    builtin?: boolean;
}

export const ef_environments: ef_environment[] = [
    {
        "id": "none",
        "label": "無環境（預設）",
        "builtin": true
    },
    {
        "id": "stable",
        "label": "穩定環境"
    },
    {
        "id": "acidic",
        "label": "酸性環境"
    },
    {
        "id": "humid",
        "label": "濕潤環境"
    },
    {
        "id": "xisang",
        "label": "息壤環境"
    }
];
