import { CountyData } from '../types/map'

export function getCountyColor(county?: CountyData): string {
    if (!county) return '#c2c2c2'

    switch (county.biobot_risk_tier) {
        case 'Minimal':
            return '#5af801'

        case 'Low':
            return '#f7df00'

        case 'Moderate':
            return '#fa4f01'

        case 'High':
            return '#a50100'

        case 'Very High':
            return '#42002d'

        default:
            return '#c2c2c2'
    }
}