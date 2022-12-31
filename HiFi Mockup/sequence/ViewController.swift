//
//  ViewController.swift
//  sequence
//

import UIKit

class ViewController: UIViewController {

    var fontSmallCard: UIFont!
    var fontLargeCard: UIFont!
    var cornerRadius: CGFloat = 0
    var labelColor: UIColor!
    var labelColorCard: UIColor!
    
    override func viewDidLoad() {
        super.viewDidLoad()

        let cards = [
            ["", "6D", "7D", "8D", "9D", "10D", "QD", "KD", "AD", ""],
            ["5D", "3H", "2H", "2S", "3S", "4S", "5S", "6S", "7S", "AC"],
            ["4D", "4H", "KD", "AD", "AC", "KC", "QC", "10C", "8S", "KC"],
            ["3D", "5H", "QD", "QH", "10H", "9H", "8H", "9C", "9S", "QC"],
            ["2D", "6H", "10D", "KH", "3H", "2H", "7H", "8C", "10S", "10C"],
            ["AS", "7H", "9D", "AH", "4H", "5H", "6H", "7C", "QS", "9C"],
            ["KS", "8H", "8D", "2C", "3C", "4C", "5C", "6C", "KS", "8C"],
            ["QS", "9H", "7D", "6D", "5D", "4D", "3D", "2D", "AS", "7C"],
            ["10S", "10H", "QH", "KH", "AH", "2C", "3C", "4C", "5C", "6C"],
            ["", "9S", "8S", "7S", "6S", "5S", "4S", "3S", "2S", ""],
        ]
        
        let option = 2
        if option == 1 {
            //Traditional
            view.backgroundColor = colorFromHex("505B4D")
            cornerRadius = 5
            let fontName = "AmericanTypewriter"
            fontSmallCard = UIFont(name: fontName, size: 16)
            fontLargeCard = UIFont(name: fontName, size: 30)
            labelColor = .white
            labelColorCard = .black
        }
        else {
            //Stylised
            view.backgroundColor = colorFromHex("ffe100")
            cornerRadius = 0
            let fontName = "MarkerFelt-Wide"
            fontSmallCard = UIFont(name: fontName, size: 16)
            fontLargeCard = UIFont(name: fontName, size: 30)
            labelColor = colorFromHex("227db6")
            labelColorCard = colorFromHex("264087")
        }
        
        let w = view.frame.width
        let h = view.frame.height
        let hCards = h * 0.6
        let topSpace = 70.0
        
        //Label at top
        let l = UILabel(frame: CGRect(x: 10, y: 10, width: w, height: topSpace))
        l.font = fontLargeCard
        l.textColor = labelColor
        l.text = "Your turn"
        view.addSubview(l)
        
        //Add 100 small cards
        for i in 0..<10 {
            for j in 0..<10 {
                let x = CGFloat(i) * w / 10.0
                let y = CGFloat(j) * hCards / 10.0 + topSpace
                let card = cards[j][i]
                addCard(card, x, y, w / 10.0, hCards / 10.0, true)
            }
        }
        //Add 6 large cards
        let y = hCards + topSpace + 30.0
        let gap = 5.0
        let width = w / 6
        for i in 0..<6 {
            let x = CGFloat(i) * width
            let card = ["AD", "5C", "6H", "9S", "JD", "QH"][i]
            addCard(card, x + gap, y, width - gap * 2, (width - gap * 2) * 1.5, false)
        }
    }

    func addCard(_ card: String, _ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ isSmall: Bool) {
        let v = UIView(frame: CGRect(x: x + 1, y: y + 1, width: w - 2, height: h - 2))
        v.layer.cornerRadius = cornerRadius
        v.backgroundColor = .white
        
        if card.count == 0 {
            //Corner card
            let width = w / 2 - 6
            let height = h / 2 - 6
            var i = UIImageView(frame: CGRect(x: 4, y: 4, width: width, height: height))
            i.image = UIImage(named: "heart")
            v.addSubview(i)
            i = UIImageView(frame: CGRect(x: w / 2, y: 4, width: width, height: height))
            i.image = UIImage(named: "club")
            v.addSubview(i)
            i = UIImageView(frame: CGRect(x: 4, y: h / 2, width: width, height: height))
            i.image = UIImage(named: "spade")
            v.addSubview(i)
            i = UIImageView(frame: CGRect(x: w / 2, y: h / 2, width: width, height: height))
            i.image = UIImage(named: "diamond")
            v.addSubview(i)
        }
        else {
            let suit = String(card.suffix(1))
            let val = String(card.prefix(card.count - 1))

            //Text
            let l = UILabel(frame: CGRect(x: 3, y: 0, width: w, height: h / 2))
            l.font = isSmall ? fontSmallCard : fontLargeCard
            l.textColor = labelColorCard
            l.text = val
            v.addSubview(l)
            
            //Image
            var imageName: String
            switch suit {
            case "H":
                imageName = "heart"
            case "C":
                imageName = "club"
            case "D":
                imageName = "diamond"
            case "S":
                imageName = "spade"
            default:
                imageName = ""
            }
            let i = UIImageView(frame: CGRect(x: w / 2 - 4, y: h / 2 - 4, width: w / 2, height: h / 2))
            i.image = UIImage(named: imageName)
            i.contentMode = .scaleAspectFit
            v.addSubview(i)
        }
        view.addSubview(v)
    }
    
    func colorFromRGB(_ r: Int, _ g: Int, _ b: Int) -> UIColor {
        return UIColor(red: CGFloat(r)/256.0, green: CGFloat(g)/256.0, blue: CGFloat(b)/256.0, alpha: 1)
    }
    
    func colorFromHex(_ hex: String) -> UIColor? {
        var start = hex.index(hex.startIndex, offsetBy: 0)
        if hex.hasPrefix("#") {
            start = hex.index(hex.startIndex, offsetBy: 1)
        }
        let hexColor = String(hex[start...])
        
        if hexColor.count == 6 {
            let scanner = Scanner(string: hexColor)
            var hexNumber: UInt64 = 0
            
            if scanner.scanHexInt64(&hexNumber) {
                let r = CGFloat((hexNumber & 0xff0000) >> 16) / 255.0
                let g = CGFloat((hexNumber & 0x00ff00) >> 8) / 255.0
                let b = CGFloat((hexNumber & 0x0000ff) >> 0) / 255.0
                
                return UIColor(red: r, green: g, blue: b, alpha: 1.0)
            }
        }
        return nil
    }
}

