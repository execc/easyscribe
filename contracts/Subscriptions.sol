pragma solidity ^0.5.0;

import "./IERC20.sol";

contract Subscriptions {
    
    /// Describes subscription
    struct Subscription {
        /// subscription client
        address client;
        
        /// defines the token contract which payments are paid from.
        address token;
        
        /// the address of the provider
        address provider;
        
        /// the number of seconds per time unit
        uint256 time_unit;
        
        ///  the number of tokens that can be paid towards the subscription per time_unit;
        uint256 tokens_per_time_unit;
        
        /// the timestamp when the last payment was made
        uint256 last_payment_at;
        
        /// if the subscription has been cancelled
        bool canceled;
    }
    
    /// Event that a new subscription was created
    event SubsctiptionCreated(
        bytes32 indexed _id,
        address indexed _client,
        address indexed _provider,
        address _token,
        uint256 _time_unit,
        uint256 _tokens_per_time_unit
    );
    
    /// Event that a new subscription was canceled
    event SubsctiptionCanceled(
        bytes32 indexed _id,
        address indexed _client,
        address indexed _provider
    );
    
    /// Event that a subscription was payed
    event SubscriptionPayed(
        bytes32 indexed _id,
        address indexed _client,
        address indexed _provider,
        address _token,
        uint256 _amount
    );
    
    /// All subscriptions in a system
    mapping(bytes32 => Subscription) subscriptions;
    
    /// Subscriptions of concrete user
    mapping(address => bytes32[]) clients;
    
    /// Subscriptions of concrete provider
    mapping(address => bytes32[]) providers;
    
    /// Creates new subscription
    function createSubscription(
        address _token, 
        address _provider,
        uint256 _time_uint,
        uint256 _tokens_per_time_unit
    ) public returns (bytes32) {
        
        // Checks on input data basic validity. Note, that 
        // there can be on-chain subscription terms registry
        //
        require(_token != address(0));
        require(_provider != address(0));
        require(_time_uint > 0);
        require(_tokens_per_time_unit > 0);
        
        bytes32 id = keccak256(abi.encodePacked(
            msg.sender,
            _token,
            _provider,
            _time_uint,
            _tokens_per_time_unit
        ));
        
        Subscription memory subscription = Subscription(
            msg.sender,
            _token,
            _provider,
            _time_uint,
            _tokens_per_time_unit,
            now,
            false
        );
        
        subscriptions[id] = subscription;
        clients[msg.sender].push(id);
        providers[_provider].push(id);
        
        emit SubsctiptionCreated(
            id,
            msg.sender,
            _provider,
            _token,
            _time_uint,
            _tokens_per_time_unit
        );
        
        return id;
    }
    
    /// Cancels subscription
    function cancelSubscription(
        bytes32 _id
    ) public returns (bool) {
        
        require(subscriptions[_id].client == msg.sender);
        require(subscriptions[_id].canceled == false);
        
        subscriptions[_id].canceled = true;
        
        emit SubsctiptionCanceled(
            _id,
            msg.sender,
            subscriptions[_id].provider
        );
        
        return true;
    }
    
    /// Executes subscriptions
    function executeSubscription(
        bytes32 _id
    ) public returns (bool) {
            
        require(subscriptions[_id].canceled == false);
        
        uint256 amount = getSubscriptionAmount(_id);
        
        subscriptions[_id].last_payment_at = now;
        
        IERC20 token = IERC20(subscriptions[_id].token);
        token.transferFrom(
            subscriptions[_id].client,
            address(this),
            amount
        );
        
        token.transfer(subscriptions[_id].provider, amount);
        
        emit SubscriptionPayed(
            _id,
            subscriptions[_id].client,
            subscriptions[_id].provider,
            subscriptions[_id].token,
            amount
        );
        
        return true;
    }
    
    /// Computes how much provider can withdraw with conrete subscription
    function getSubscriptionAmount(
        bytes32 _id
    ) public view returns (uint256) {
        
        require(subscriptions[_id].canceled == false);
        
        uint256 time_unit = subscriptions[_id].time_unit;
        uint256 tokens_per_time_unit = subscriptions[_id].tokens_per_time_unit;
        uint256 last_payment_at = subscriptions[_id].last_payment_at;
        
        uint256 periods = (now - last_payment_at) / time_unit;
        
        return periods * tokens_per_time_unit;
    }
    
    function getClientSubscriptionCount(
        address _client
    ) public view returns (uint256) {
        return clients[_client].length;
    }
    
    function getClientSubscription(
        address _client,
        uint256 _index
    ) public view returns 
    (
        address,
        address,
        address,
        uint256,
        uint256,
        uint256,
        bool
    ) {
        Subscription memory subscription = subscriptions[clients[_client][_index]];
        return (
            subscription.client,
            subscription.token,
            subscription.provider,
            subscription.time_unit,
            subscription.tokens_per_time_unit,
            subscription.last_payment_at,
            subscription.canceled
        );
    }
    
    function getProviderSubscriptionCount(
        address _provider
    ) public view returns (uint256) {
        return providers[_provider].length;
    }
    
    function getProviderSubscription(
        address _provider,
        uint256 _index
    ) public view returns 
    (
        address,
        address,
        address,
        uint256,
        uint256,
        uint256,
        bool
    ) {
        Subscription memory subscription = subscriptions[providers[_provider][_index]];
        return (
            subscription.client,
            subscription.token,
            subscription.provider,
            subscription.time_unit,
            subscription.tokens_per_time_unit,
            subscription.last_payment_at,
            subscription.canceled
        );
    }
}
