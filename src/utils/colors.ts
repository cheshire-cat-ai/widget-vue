import { colord, extend } from "colord"
import mixPlugin from "colord/plugins/mix"

extend([mixPlugin])

const turnColorValuesToString = (input: string) => {
    const resArr = input.match(/\d+(\.\d+)?%|\d+(\.\d+)?/g)
    if (resArr) {
        const [h, s, l] = resArr.map(parseFloat)
        return `${h} ${s}% ${l}%`
    }
    return `0 0% 0%`
}

export const convertToHsl = (input: string) => turnColorValuesToString(colord(input).toHslString())

export const generateForegroundColorFrom = (input: string, percentage = 0.8) => {
    const str = colord(input)
        .mix(colord(input).isDark() ? "white" : "black", percentage)
        .toHslString()
    return turnColorValuesToString(str)
}

export const generateDarkenColorFrom = (input: string, percentage = 0.07) => {
    const str = colord(input).darken(percentage).toHslString()
    return turnColorValuesToString(str)
}