package com.assetguardian;

import org.springframework.stereotype.Service;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

@Service
public class WatermarkService {

    public byte[] applyWatermark(InputStream imageStream, String watermarkText) throws IOException {
        BufferedImage sourceImage = ImageIO.read(imageStream);
        
        Graphics2D g2d = (Graphics2D) sourceImage.getGraphics();
        
        // Premium look for watermark: semi-transparent, rotating
        AlphaComposite alphaChannel = AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.3f);
        g2d.setComposite(alphaChannel);
        g2d.setColor(Color.WHITE);
        g2d.setFont(new Font("Arial", Font.BOLD, 64));
        
        FontMetrics fontMetrics = g2d.getFontMetrics();
        Rectangle rect = new Rectangle(0, 0, sourceImage.getWidth(), sourceImage.getHeight());
        
        // Draw in center
        int x = (rect.width - fontMetrics.stringWidth(watermarkText)) / 2;
        int y = (rect.height - fontMetrics.getHeight()) / 2 + fontMetrics.getAscent();
        
        g2d.drawString(watermarkText, x, y);
        g2d.dispose();
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(sourceImage, "png", baos);
        return baos.toByteArray();
    }
}
