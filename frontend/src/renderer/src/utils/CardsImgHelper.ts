import * as images from "@/assets";
import { Card } from "@shared/models";

export function assignLastCardImg(card: Card) {
  if (card.color && card.value !== "wild" && card.value !== "plus4") {
    card.imgSrc = images[`${card.color}${card.value}`]?.default || "";
    card.alt = `${card.color}${card.value}`;
  } else {
    card.imgSrc = images[card.value]?.default || "";
    card.alt = card.value;
  }
}

export function assignCardsImg(cards: Card[]) {
  cards.forEach(assignLastCardImg);
}
