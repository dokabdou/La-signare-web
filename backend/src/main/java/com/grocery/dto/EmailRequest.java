package com.grocery.dto;

public class EmailRequest {
    private String to;
    private String subject;
    private String htmlBody;

    public String getTo() { 
		return to; 
	}
	
    public void setTo(String to) { 
		this.to = to; 
	}

    public String getSubject() { 
		return subject; 
	}
    public void setSubject(String subject) { 
		this.subject = subject; 
	}

    public String getHtmlBody() { 
		return htmlBody; 
	}
    public void setHtmlBody(String htmlBody) { 
		this.htmlBody = htmlBody;
	}
}