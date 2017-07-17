//
//  shareNetworkTool.swift
//  xiaomingVideo
//
//  Created by renminghe on 2017/4/28.
//  Copyright © 2017年 renminghe. All rights reserved.
//

import UIKit
import AFNetworking


// 定义枚举请求方式
enum HTTPRequestMethod {
    case GET
    case POST
}


class NetworkManager: AFHTTPSessionManager {
    
    // 单例
    static let shared = NetworkManager();
    
    let domain = "http://127.0.0.1:9090/";
   
    
    /// 请求网络主方法
    ///
    /// - Parameters:
    ///   - requestMethod: 请求方式
    ///   - urlString: 请求地址
    ///   - parameters: 请求参数
    ///   - completion: 回调函数
    func request(requestMethod: HTTPRequestMethod, urlString: String, parameters: [String: AnyObject]?, completion: @escaping (AnyObject?) -> ()) {
        
        // 成功回调
        let success = {(task: URLSessionDataTask, json: Any) -> () in completion(json as AnyObject?)};
        
        // 失败回调
        let failure = {(task: URLSessionDataTask?, error: Error) -> () in print("网络请求错误\(error)");completion(nil);};
        
        if requestMethod == .GET {
            get(urlString, parameters: parameters, progress: nil, success: success, failure: failure)
        } else {
            post(urlString, parameters: parameters, progress: nil, success: success, failure: failure)
        }
    }
}




